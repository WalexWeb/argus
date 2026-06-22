'use client';

import { useState } from 'react';
import { reloadMockLogs } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function ReloadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReload() {
    setLoading(true);
    try {
      await reloadMockLogs();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReload}
      disabled={loading}
      className="w-full rounded-2xl bg-linear-to-r from-pistachio-600 to-pistachio-400 px-4 py-3 text-base font-medium text-zinc-900 shadow-lg shadow-pistachio-600/25 transition hover:from-pistachio-500 hover:to-pistachio-300 disabled:opacity-50"
    >
      {loading ? 'Загрузка...' : '↻ Перезагрузить логи'}
    </button>
  );
}
