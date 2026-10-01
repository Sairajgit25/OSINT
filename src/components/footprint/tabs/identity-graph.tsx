// FootprintX — Identity Graph (§34) — React Flow, correlation confidence edges

"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AtSign, User, Database, Link2, ImageIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GraphNodeData, ReportGraph } from "@/lib/scanner/types";

const KIND_META: Record<
  GraphNodeData["kind"],
  { icon: typeof AtSign; border: string; iconColor: string; label: string }
> = {
  identifier: { icon: AtSign, border: "border-xgreen/60", iconColor: "text-xgreen", label: "identifier" },
  account: { icon: User, border: "border-xgreen/35", iconColor: "text-xgreen/85", label: "account" },
  presence: { icon: User, border: "border-xteal/35", iconColor: "text-xteal", label: "presence" },
  breach: { icon: Database, border: "border-xred/35", iconColor: "text-xred", label: "breach" },
  attribute: { icon: Link2, border: "border-xamber/35", iconColor: "text-xamber", label: "attribute" },
};

function FxNode({ data }: NodeProps<Node<{ label: string; sublabel?: string; kind: GraphNodeData["kind"]; status?: string; hue?: number }>>) {
  const meta = KIND_META[data.kind];
  const Icon = data.kind === "attribute" && data.label === "Shared avatar" ? ImageIcon : meta.icon;
  void Building2;
  return (
    <div
      className={cn(
        "min-w-[150px] max-w-[190px] rounded-lg border bg-card px-3 py-2.5 shadow-lg shadow-black/40",
        meta.border,
        data.kind === "identifier" && "fx-glow-box",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-xgreen/60" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-xgreen/60" />
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", meta.iconColor)} aria-hidden />
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">{data.label}</div>
          {data.sublabel && (
            <div className="truncate font-mono text-[9px] text-muted-foreground">{data.sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { fxNode: FxNode };

export default function IdentityGraph({ graph }: { graph: ReportGraph }) {
  const nodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "fxNode",
        position: n.position,
        data: n.data as unknown as Node["data"],
        draggable: true,
      })),
    [graph.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
        style: {
          stroke: e.label.startsWith("corr") ? "rgba(251,191,36,0.6)" : "rgba(52,226,138,0.4)",
        },
        labelStyle: { fill: "#e4efe8", fontSize: 9.5, fontFamily: "var(--font-geist-mono)" },
        labelBgStyle: { fill: "#0c130f", fillOpacity: 0.92 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
      })),
    [graph.edges],
  );

  return (
    <div className="h-[480px] overflow-hidden rounded-xl border border-border bg-[#060a08]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.1 }}
        minZoom={0.4}
        maxZoom={1.6}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(52,226,138,0.16)" />
        <Controls showInteractive={false} className="!border !border-border !rounded-md !overflow-hidden" />
        <MiniMap
          nodeColor={(n) => {
            const kind = (n.data as unknown as GraphNodeData)?.kind;
            if (kind === "breach") return "rgba(248,113,113,0.7)";
            if (kind === "attribute") return "rgba(251,191,36,0.7)";
            if (kind === "identifier") return "rgba(52,226,138,0.9)";
            return "rgba(45,212,191,0.6)";
          }}
          maskColor="rgba(5,8,7,0.75)"
          style={{ width: 148, height: 96 }}
        />
      </ReactFlow>
    </div>
  );
}
