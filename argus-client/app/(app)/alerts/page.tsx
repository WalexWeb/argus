import { getAlerts } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertsExplorer } from "@/components/AlertsList";
import { Card, CardHeader } from "@/components/ui/Card";

export default async function AlertsPage() {
  let alerts;

  try {
    alerts = await getAlerts();
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="Алерты"
        description="Результаты работы механизма корреляции — потенциальные инциденты"
      />

      <Card>
        <CardHeader
          title="Обнаруженные алерты"
          subtitle={`${alerts.total} срабатываний правил корреляции`}
        />
        <AlertsExplorer alerts={alerts.alerts} />
      </Card>
    </>
  );
}
