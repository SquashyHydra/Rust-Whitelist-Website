import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/env";
import { approveWhitelistRequest } from "@/lib/whitelist";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const { id } = await params;
    await approveWhitelistRequest(id, email, body);

    return NextResponse.json({
      message: "Request approved and RCON command sent.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid moderation payload.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Approval failed.",
      },
      { status: 500 },
    );
  }
}
