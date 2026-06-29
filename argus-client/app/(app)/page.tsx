import { getSummary } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  let summary;

  try {
    summary = await getSummary();
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="Дашборд"
        description="Агрегированная статистика и ключевые показатели системы мониторинга"
      />

      <DashboardView summary={summary} />
    </>
  );
}
