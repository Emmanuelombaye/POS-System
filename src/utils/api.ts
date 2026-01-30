const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = {
    async get(endpoint: string) {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    async delete(endpoint: string) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    }
};
