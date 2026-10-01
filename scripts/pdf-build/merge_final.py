#!/usr/bin/env python3
"""Merge cover (page 0) + body PDF -> single final PDF, normalized to A4."""
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89

def normalize(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.3 or abs(h - A4_H) > 0.3:
        page.scale_to(A4_W, A4_H)
    return page

cover = "/home/z/my-project/scripts/pdf-build/cover.pdf"
body = "/home/z/my-project/scripts/pdf-build/body.pdf"
out = "/home/z/my-project/download/FootprintX_PRD.pdf"

writer = PdfWriter()
writer.add_page(normalize(PdfReader(cover).pages[0]))
for page in PdfReader(body).pages:
    writer.add_page(normalize(page))
writer.add_metadata({
    "/Title": "FootprintX Product Requirements Document",
    "/Author": "Z.ai",
    "/Creator": "Z.ai",
    "/Subject": "Digital Footprint Intelligence Platform - PRD v0.1",
})
with open(out, "wb") as f:
    writer.write(f)
print("merged:", out, "| pages:", len(writer.pages))
