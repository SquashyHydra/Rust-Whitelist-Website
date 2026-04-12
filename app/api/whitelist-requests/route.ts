import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createWhitelistRequest,
  DuplicateWhitelistRequestError,
  InvalidSteamProfileError,
  RecentRejectionCooldownError,
} from "@/lib/whitelist";

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstForwarded = forwardedFor.split(",")[0]?.trim();

    if (firstForwarded) {
      return firstForwarded;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();

  if (cfIp) {
    return cfIp;
  }

  return null;
}

function getRequestDevice(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent) {
    return null;
  }

  const deviceType = /mobile/i.test(userAgent)
    ? "Mobile"
    : /tablet|ipad/i.test(userAgent)
      ? "Tablet"
      : "Desktop";

  const platform = /windows/i.test(userAgent)
    ? "Windows"
    : /android/i.test(userAgent)
      ? "Android"
      : /iphone|ios/i.test(userAgent)
        ? "iPhone"
        : /ipad/i.test(userAgent)
          ? "iPad"
          : /mac os x|macintosh/i.test(userAgent)
            ? "macOS"
            : /linux/i.test(userAgent)
              ? "Linux"
              : "Unknown OS";

  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)
      ? "Chrome"
      : /firefox\//i.test(userAgent)
        ? "Firefox"
        : /safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)
          ? "Safari"
          : "Browser";

  return `${deviceType} · ${platform} · ${browser}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const created = await createWhitelistRequest(body, {
      ipAddress: getRequestIpAddress(request),
      device: getRequestDevice(request),
    });

    return NextResponse.json({
      message: "Whitelist request submitted. Admins have been notified.",
      requestId: created.id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid request payload.",
        },
        { status: 400 },
      );
    }

    if (error instanceof DuplicateWhitelistRequestError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      );
    }

    if (error instanceof RecentRejectionCooldownError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 429 },
      );
    }

    if (error instanceof InvalidSteamProfileError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error while creating the request.",
      },
      { status: 500 },
    );
  }
}
