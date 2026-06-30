export const GoogleCalendarClient = {
  /**
   * Fetches raw calendar events from Google API or local/api bridge.
   */
  async fetchEvents(start?: string, end?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    const url = `/api/sync/calendar?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Calendar Client failed with status ${res.status}`);
    }
    return res.json();
  }
};
