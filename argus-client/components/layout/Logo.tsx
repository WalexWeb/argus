import Image from "next/image";
import { LOGO_SRC } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function Logo({
  size = 50,
  showText = false,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 grid-rows-2 items-center justify-center",
        className,
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="АРГУС"
        width={size}
        height={size}
        className="rounded-2xl shadow-lg shadow-pistachio-600/20 ring-pistachio-500/20"
        priority
      />
      {showText && (
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">
            АРГУС
          </h1>
        </div>
      )}
    </div>
  );
}
