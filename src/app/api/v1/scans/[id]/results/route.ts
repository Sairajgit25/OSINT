// FootprintX API — GET /api/v1/scans/{id}/results (§41 Results)

import { NextRequest, NextResponse } from "next/server";
import { finalizeIfCompleted, getScan, statusPayload } from "@/lib/scanner/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const state = await getScan(id);
  if (!state) {
    return NextResponse.json({ error: "Scan not found or expired." }, { status: 404 });
  }
  const status = statusPayload(state);
  if (status.status !== "completed" || !state.report) {
    return NextResponse.json(
      { scan_id: id, status: status.status, progress: status.progress, error: "Scan still in progress." },
      { status: 202 },
    );
  }
  await finalizeIfCompleted(state);
  return NextResponse.json(state.report);
}
