// FootprintX API — GET /api/v1/scans/{id} (status, §42 events), DELETE (§37)

import { NextRequest, NextResponse } from "next/server";
import { deleteScan, finalizeIfCompleted, getScan, statusPayload } from "@/lib/scanner/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const state = await getScan(id);
  if (!state) {
    return NextResponse.json({ error: "Scan not found or expired." }, { status: 404 });
  }
  const payload = statusPayload(state);
  await finalizeIfCompleted(state);
  return NextResponse.json(payload);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteScan(id);
  if (!ok) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true, scan_id: id });
}
