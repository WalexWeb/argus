'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

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
  icon: string;
}) {
  const nodeData = data as NodeData;

  return (
    <div
      className={cn(
        'min-w-[200px] max-w-[240px] rounded-2xl border-2 px-4 py-3 shadow-lg transition-all duration-200',
        tone,
        nodeData.dimmed && 'opacity-25 scale-95',
        nodeData.highlighted && 'ring-2 ring-pistachio-400 ring-offset-2 ring-offset-[#0a0c0a]',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400 !w-2 !h-2" />
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
            {nodeData.group}
          </p>
          <p className="mt-0.5 break-all text-sm font-semibold leading-snug text-zinc-50">
            {nodeData.label}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-zinc-400 !w-2 !h-2" />
    </div>
  );
}

export const SourceNode = memo(function SourceNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      tone="border-lime-500/40 bg-lime-950/60"
      icon="🖥"
    />
  );
});

export const IpNode = memo(function IpNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      tone="border-pistachio-500/50 bg-emerald-950/60"
      icon="🌐"
    />
  );
});

export const UserNode = memo(function UserNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      tone="border-emerald-500/40 bg-emerald-950/50"
      icon="👤"
    />
  );
});

export const AlertNode = memo(function AlertNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      tone="border-red-500/50 bg-red-950/70"
      icon="⚠"
    />
  );
});

export const nodeTypes = {
  source: SourceNode,
  ip: IpNode,
  user: UserNode,
  alert: AlertNode,
};
