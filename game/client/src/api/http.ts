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
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return { data: (await res.json()) as T };
  },

  async get<T>(path: string): Promise<{ data: T }> {
    const res = await fetch(`http://localhost:3000${path}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return { data: (await res.json()) as T };
  },
};
