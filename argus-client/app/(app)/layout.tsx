import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mesh-bg flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1680px] px-6 py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
