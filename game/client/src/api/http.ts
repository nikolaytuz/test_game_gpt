/**
 * Minimal HTTP helper using the Fetch API to avoid external dependencies.
 * Provides only the functionality required by the app.
 */
export const http = {
  async post<T>(path: string, body?: any): Promise<{ data: T }> {
    const res = await fetch(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data: (await res.json()) as T };
  },
};
