import { getEvents } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventsExplorer } from '@/components/EventsExplorer';

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

      <EventsExplorer events={data.events} />
    </>
  );
}
