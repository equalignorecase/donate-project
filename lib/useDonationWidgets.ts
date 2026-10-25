'use client';

import { useEffect, useState } from 'react';
import { loadDonationWidgets } from './donation-client';
import type { WidgetData } from './widgets';

export function useDonationWidgets(revision: number) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    setError(false);
    const refresh = async () => {
      if (running || controller.signal.aborted) return;
      running = true;
      try {
        const next = await loadDonationWidgets(controller.signal);
        if (!controller.signal.aborted) { setData(next); setError(false); }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        running = false;
      }
    };
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 60000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [revision, retryKey]);

  return { data, error, retry: () => setRetryKey((key) => key + 1) };
}
