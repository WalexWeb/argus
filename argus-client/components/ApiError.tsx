import { Logo } from "@/components/layout/Logo";

export function ApiError() {
  return (
    <div className="mesh-bg flex h-screen items-center justify-center">
      <div className="glass-card p-10 text-center">
        <div className="flex justify-center">
          <Logo size={150} />
        </div>
        <h1 className="text-2xl pt-6 font-bold text-zinc-100">
          АРГУС недоступен
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          Не удалось подключиться к API.
        </p>
      </div>
    </div>
  );
}
