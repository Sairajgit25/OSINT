// FootprintX API — POST /api/v1/scans (§41 Start scan), GET (recent history)

import { NextRequest, NextResponse } from "next/server";
import { createScan, recentScans } from "@/lib/scanner/store";
import { validateIdentifier } from "@/lib/scanner/hash";
import type { ScanConfig } from "@/lib/scanner/types";

export async function POST(req: NextRequest) {
  let body: Partial<ScanConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const type = body.type;
  const value = typeof body.value === "string" ? body.value.trim() : "";
  const mode = body.mode === "deep" ? "deep" : "quick";
  const retention =
    body.retention === "until_deleted" || body.retention === "after_scan" || body.retention === "d30"
      ? body.retention
      : "d30";

  if (type !== "email" && type !== "username") {
    return NextResponse.json(
      { error: "Unsupported identifier type. MVP v0.1 supports email and username." },
      { status: 400 },
    );
  }

  const check = validateIdentifier(type, value);
  if (!check.valid) {
    return NextResponse.json({ error: check.reason ?? "Invalid identifier." }, { status: 422 });
  }

  const privacy = retention === "after_scan";
  const config: ScanConfig = { type, value, mode, privacy, retention };
  const state = await createScan(config);

  return NextResponse.json(
    { scan_id: state.id, status: "queued", privacy_mode: privacy, mode },
    { status: 201 },
  );
}

export async function GET() {
  const scans = await recentScans(6);
  return NextResponse.json({ scans });
}
