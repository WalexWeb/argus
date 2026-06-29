import { getSources, getSummary } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { SourcesView } from "@/components/sources/SourcesView";

export default async function SourcesPage() {
  let sourcesData;
  let summary;

  try {
    [sourcesData, summary] = await Promise.all([getSources(), getSummary()]);
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="Источники"
        description="Контроль подключённых источников событий и анализ их активности"
      />

      <SourcesView
        sources={sourcesData.sources}
        totalEvents={summary.events_unique}
      />
    </>
  );
}
