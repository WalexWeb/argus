import type { ReactNode } from "react";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  MdDevices,
  MdPublic,
  MdPerson,
  MdWarningAmber,
  MdAnalytics,
} from "react-icons/md";

import { cn } from "@/lib/utils";

type NodeData = {
  label: string;
  group: string;
  dimmed?: boolean;
  highlighted?: boolean;
};

function BaseNode({
  data,
  tone,
  icon,
}: NodeProps & {
  tone: string;
  icon: ReactNode;
}) {
  const nodeData = data as NodeData;

  return (
    <div
      className={cn(
        "min-w-52 max-w-72 rounded-2xl border-2 px-4 py-3 shadow-lg transition-all duration-200",
        tone,
        nodeData.dimmed && "opacity-25 scale-95",
        nodeData.highlighted &&
          "ring-2 ring-pistachio-400 ring-offset-2 ring-offset-[#0a0c0a]",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="bg-zinc-400! h-2! w-2!"
      />

      <div className="flex items-start gap-2">
        <span className="text-lg text-pistachio-300">{icon}</span>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
            {nodeData.group}
          </p>

          <p className="mt-1 break-all text-sm font-semibold text-zinc-50">
            {nodeData.label}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="bg-zinc-400! h-2! w-2!"
      />
    </div>
  );
}

export const SourceNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    tone="border-lime-500/40 bg-lime-950/60"
    icon={<MdDevices />}
  />
));

export const IpNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    tone="border-pistachio-500/40 bg-emerald-950/60"
    icon={<MdPublic />}
  />
));

export const UserNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    tone="border-emerald-500/40 bg-emerald-950/50"
    icon={<MdPerson />}
  />
));

export const EvidenceNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    tone="border-sky-500/40 bg-sky-950/50"
    icon={<MdAnalytics />}
  />
));

export const AlertNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    tone="border-red-500/50 bg-red-950/70"
    icon={<MdWarningAmber />}
  />
));

export const nodeTypes = {
  source: SourceNode,
  ip: IpNode,
  user: UserNode,
  evidence: EvidenceNode,
  alert: AlertNode,
};
