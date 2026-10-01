// FootprintX API — GET /api/v1/scanners (§45 Scanner Health System)

import { NextResponse } from "next/server";
import { SCANNER_HEALTH } from "@/lib/scanner/catalog";

export async function GET() {
  return NextResponse.json({
    simulated: true,
    scanners: SCANNER_HEALTH.map((s) => ({
      ...s,
      last_scan: null,
      last_error: null,
      response_time_ms: null,
    })),
  });
}
