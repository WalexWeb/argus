import { getRules, getAlerts } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { CorrelationView } from "@/components/correlation/CorrelationView";

export default async function CorrelationPage({
  searchParams,
}: {
  searchParams: Promise<{ alert?: string }>;
}) {
  let rules;
  let alerts;
  const params = await searchParams;
  const initialAlertId = params.alert ? Number(params.alert) : undefined;

  try {
    [rules, alerts] = await Promise.all([getRules(), getAlerts()]);
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="Корреляция"
        description="Расследование конкретного инцидента информационной безопасности"
      />

      <CorrelationView
        alerts={alerts.alerts}
        rules={rules.rules}
        initialAlertId={initialAlertId}
      />
    </>
  );
}
