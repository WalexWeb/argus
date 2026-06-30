import { getEvents } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventsExplorer } from "@/components/EventsExplorer";
import { EventsTable } from "@/components/EventsTable";

export default async function EventsPage() {
  let data;

  try {
    data = await getEvents();
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="События"
        description="Журнал нормализованных событий информационной безопасности"
      />

      <EventsTable events={data.events}/>

      <EventsExplorer events={data.events} />
    </>
  );
}
