// =============================================
// TimelineData.ts
// =============================================

// This file defines a list of paper titles that should appear
// on the vertical timeline within the application.
//
// The main App component uses this array to determine which
// papers from the dataset (`papers`) should be converted into
// `TimelineEvent` objects and visualized in the timeline view.

import * as React from 'react';

const listeners = new Set<React.Dispatch<React.SetStateAction<string[]>>>();
let titles: string[] = [];
/**
 * React hook — components call this to get live timeline titles.
 * Any call to setTimelineTitles() will notify all subscribers.
 */
export function timelineTitles(): string[] {
  const [state, setState] = React.useState<string[]>(titles);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

/** Imperative setter — call this after you fetch from your DB. */
export function setTimelineTitles(next: string[]) {
  titles = next.slice(); // copy to avoid external mutation
  for (const notify of listeners) notify(titles);
}

/**
 * Optional helper: pass in your async DB function that returns string[] titles.
 * Example usage shown below.
 */
export async function refreshTimelineTitlesFromDb(
  getTitles: () => Promise<string[]>
) {
  const next = await getTitles();
  setTimelineTitles(next);
}
