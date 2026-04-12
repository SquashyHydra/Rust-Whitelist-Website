import {
  AuditAction,
  NotificationState,
  Prisma,
  RequestStatus,
  SteamResolutionState,
} from "@prisma/client";

import { env } from "@/lib/env";
import { sendNewWhitelistRequestEmail, sendWhitelistDecisionEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import { sendWhitelistCommand } from "@/lib/rcon";
import { resolveSteamProfile, toSteamCommunityProfileUrl } from "@/lib/steam";
import { adminDecisionSchema, whitelistRequestSchema } from "@/lib/validation";

const activeDuplicateStatuses = [RequestStatus.PENDING, RequestStatus.APPROVED];
const rejectionCooldownMs = 24 * 60 * 60 * 1000;

function toNotificationState(state: "SKIPPED" | "FAILED" | "SENT") {
  return state === "SKIPPED"
    ? NotificationState.SKIPPED
    : state === "FAILED"
      ? NotificationState.FAILED
      : NotificationState.SENT;
}

export class InvalidSteamProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSteamProfileError";
  }
}

export class DuplicateWhitelistRequestError extends Error {
  constructor(kind: "steam" | "email") {
    super(
      kind === "steam"
        ? "A whitelist request for this Steam profile is already pending or has already been approved."
        : "A whitelist request for this email is already pending or has already been approved.",
    );
    this.name = "DuplicateWhitelistRequestError";
  }
}

export class RecentRejectionCooldownError extends Error {
  constructor(hoursRemaining: number) {
    super(
      `This email was used on a recently rejected request. Please wait about ${hoursRemaining} more hour${hoursRemaining === 1 ? "" : "s"} before submitting again.`,
    );
    this.name = "RecentRejectionCooldownError";
  }
}

function buildAdminRequestUrl(requestId: string) {
  return `${env.appUrl.replace(/\/$/, "")}/admin/requests/${requestId}`;
}

type RequestMetadata = {
  ipAddress: string | null;
  device: string | null;
};

export async function createWhitelistRequest(rawInput: unknown, metadata?: RequestMetadata) {
  const input = whitelistRequestSchema.parse(rawInput);
  const resolution = await resolveSteamProfile(input.steamProfileUrl, env.steamApiKey);

  if (!resolution.steamId64 || resolution.resolutionState !== "RESOLVED") {
    throw new InvalidSteamProfileError(
      resolution.resolutionError ??
        "This Steam profile could not be verified. Fake or non-existent Steam links are not accepted.",
    );
  }

  const request = await prisma.$transaction(
    async (tx) => {
      if (resolution.steamId64) {
        const duplicateBySteamId = await tx.whitelistRequest.findFirst({
          where: {
            status: { in: activeDuplicateStatuses },
            steamId64: resolution.steamId64,
          },
          select: { id: true },
        });

        if (duplicateBySteamId) {
          throw new DuplicateWhitelistRequestError("steam");
        }
      }

      const duplicateByNormalizedUrl = await tx.whitelistRequest.findFirst({
        where: {
          status: { in: activeDuplicateStatuses },
          steamProfileUrlNormalized: resolution.normalizedUrl,
        },
        select: { id: true },
      });

      if (duplicateByNormalizedUrl) {
        throw new DuplicateWhitelistRequestError("steam");
      }

      const duplicateByApplicantEmail = await tx.whitelistRequest.findFirst({
        where: {
          status: { in: activeDuplicateStatuses },
          applicantEmail: input.applicantEmail,
        },
        select: { id: true },
      });

      if (duplicateByApplicantEmail) {
        throw new DuplicateWhitelistRequestError("email");
      }

      const recentRejectedRequest = await tx.whitelistRequest.findFirst({
        where: {
          applicantEmail: input.applicantEmail,
          status: RequestStatus.REJECTED,
          reviewedAt: {
            not: null,
          },
        },
        orderBy: {
          reviewedAt: "desc",
        },
        select: {
          reviewedAt: true,
        },
      });

      if (recentRejectedRequest?.reviewedAt) {
        const elapsed = Date.now() - recentRejectedRequest.reviewedAt.getTime();

        if (elapsed < rejectionCooldownMs) {
          const hoursRemaining = Math.max(1, Math.ceil((rejectionCooldownMs - elapsed) / (60 * 60 * 1000)));
          throw new RecentRejectionCooldownError(hoursRemaining);
        }
      }

      return tx.whitelistRequest.create({
        data: {
          applicantEmail: input.applicantEmail,
          requestIpAddress: metadata?.ipAddress ?? null,
          requestDevice: metadata?.device ?? null,
          steamProfileUrl: input.steamProfileUrl,
          steamProfileUrlNormalized: resolution.normalizedUrl,
          steamVanityName: resolution.vanityName,
          steamId64: resolution.steamId64,
          steamPersonaName: resolution.personaName,
          steamAvatarUrl: resolution.avatarUrl,
          steamResolutionState: resolution.resolutionState as SteamResolutionState,
          steamResolutionError: resolution.resolutionError,
          reason: input.reason,
          auditLogs: {
            create: {
              action: AuditAction.SUBMITTED,
              details: `Whitelist request submitted from ${resolution.normalizedUrl}`,
            },
          },
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  const emailResult = await sendNewWhitelistRequestEmail({
    requestId: request.id,
    steamProfileUrl: request.steamProfileUrlNormalized,
    steamId64: request.steamId64,
    applicantEmail: request.applicantEmail ?? "Not captured",
    reason: request.reason,
    adminUrl: buildAdminRequestUrl(request.id),
  });

  const updated = await prisma.whitelistRequest.update({
    where: { id: request.id },
    data: {
      emailDeliveryState: toNotificationState(emailResult.state),
      emailDeliveryError: emailResult.error,
      emailNotifiedAt: emailResult.state === "SENT" ? new Date() : null,
      auditLogs: {
        create: {
          action:
            emailResult.state === "SENT" ? AuditAction.EMAIL_SENT : AuditAction.EMAIL_FAILED,
          details: emailResult.error ?? "Admin notification email sent.",
        },
      },
    },
    include: {
      auditLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return updated;
}

export async function getAdminDashboardData() {
  const [pendingRequests, processedRequests] = await Promise.all([
    prisma.whitelistRequest.findMany({
      where: { status: RequestStatus.PENDING },
      orderBy: { submittedAt: "desc" },
      take: 12,
    }),
    prisma.whitelistRequest.findMany({
      where: { status: { in: [RequestStatus.APPROVED, RequestStatus.REJECTED] } },
      orderBy: { reviewedAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    pendingRequests,
    processedRequests,
  };
}

export async function getWhitelistRequestById(id: string) {
  return prisma.whitelistRequest.findUnique({
    where: { id },
    include: {
      auditLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function approveWhitelistRequest(
  requestId: string,
  reviewerEmail: string,
  rawInput: unknown,
) {
  const input = adminDecisionSchema.parse(rawInput);
  const request = await getWhitelistRequestById(requestId);

  if (!request) {
    throw new Error("Whitelist request not found.");
  }

  if (!request.steamId64) {
    throw new Error("SteamID64 is missing. Resolve the player profile before approving.");
  }

  const rconResult = await sendWhitelistCommand(request.steamId64);

  const applicantMessage = input.applicantMessage || null;

  const updatedRequest = await prisma.whitelistRequest.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.APPROVED,
      applicantMessage,
      applicantNotificationState: NotificationState.PENDING,
      applicantNotificationError: null,
      applicantNotifiedAt: null,
      reviewNote: input.reviewNote || null,
      reviewedAt: new Date(),
      reviewedByEmail: reviewerEmail,
      rconCommand: rconResult.command,
      rconResult: rconResult.response,
      auditLogs: {
        create: [
          {
            action: AuditAction.RCON_SENT,
            actorEmail: reviewerEmail,
            details: `Sent RCON command: ${rconResult.command}`,
          },
          {
            action: AuditAction.APPROVED,
            actorEmail: reviewerEmail,
            details: input.reviewNote || "Request approved.",
          },
        ],
      },
    },
  });

  const emailResult = await sendWhitelistDecisionEmail({
    requestId: updatedRequest.id,
    applicantEmail: updatedRequest.applicantEmail,
    outcome: "approved",
    applicantMessage,
  });

  return prisma.whitelistRequest.update({
    where: { id: requestId },
    data: {
      applicantNotificationState: toNotificationState(emailResult.state),
      applicantNotificationError: emailResult.error,
      applicantNotifiedAt: emailResult.state === "SENT" ? new Date() : null,
      auditLogs: {
        create: {
          action:
            emailResult.state === "SENT" ? AuditAction.EMAIL_SENT : AuditAction.EMAIL_FAILED,
          actorEmail: reviewerEmail,
          details:
            emailResult.state === "SENT"
              ? `Applicant approval email sent to ${updatedRequest.applicantEmail}.`
              : emailResult.error ?? `Applicant approval email was not sent to ${updatedRequest.applicantEmail}.`,
        },
      },
    },
  });
}

export async function rejectWhitelistRequest(
  requestId: string,
  reviewerEmail: string,
  rawInput: unknown,
) {
  const input = adminDecisionSchema.parse(rawInput);
  const request = await getWhitelistRequestById(requestId);

  if (!request) {
    throw new Error("Whitelist request not found.");
  }

  const applicantMessage = input.applicantMessage || null;

  const updatedRequest = await prisma.whitelistRequest.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.REJECTED,
      applicantMessage,
      applicantNotificationState: NotificationState.PENDING,
      applicantNotificationError: null,
      applicantNotifiedAt: null,
      reviewNote: input.reviewNote || null,
      reviewedAt: new Date(),
      reviewedByEmail: reviewerEmail,
      auditLogs: {
        create: {
          action: AuditAction.REJECTED,
          actorEmail: reviewerEmail,
          details: input.reviewNote || "Request rejected.",
        },
      },
    },
  });

  const emailResult = await sendWhitelistDecisionEmail({
    requestId: updatedRequest.id,
    applicantEmail: updatedRequest.applicantEmail,
    outcome: "rejected",
    applicantMessage,
  });

  return prisma.whitelistRequest.update({
    where: { id: requestId },
    data: {
      applicantNotificationState: toNotificationState(emailResult.state),
      applicantNotificationError: emailResult.error,
      applicantNotifiedAt: emailResult.state === "SENT" ? new Date() : null,
      auditLogs: {
        create: {
          action:
            emailResult.state === "SENT" ? AuditAction.EMAIL_SENT : AuditAction.EMAIL_FAILED,
          actorEmail: reviewerEmail,
          details:
            emailResult.state === "SENT"
              ? `Applicant rejection email sent to ${updatedRequest.applicantEmail}.`
              : emailResult.error ?? `Applicant rejection email was not sent to ${updatedRequest.applicantEmail}.`,
        },
      },
    },
  });
}

export function getPreferredSteamLink(steamId64: string | null, fallbackUrl: string) {
  if (steamId64) {
    return toSteamCommunityProfileUrl(steamId64);
  }

  return fallbackUrl;
}

export function getResolutionTone(state: SteamResolutionState) {
  switch (state) {
    case SteamResolutionState.RESOLVED:
      return "resolved";
    case SteamResolutionState.UNRESOLVED:
      return "unresolved";
    case SteamResolutionState.ERROR:
      return "error";
    default:
      return "pending";
  }
}
