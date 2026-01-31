const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    try {
        const persistedState = localStorage.getItem('eden-top-state');
        if (persistedState) {
            const { state } = JSON.parse(persistedState);
            if (state?.token) {
                headers['Authorization'] = `Bearer ${state.token}`;
            }
        }
    } catch (e) {
        console.error("Error reading token from localStorage", e);
    }

    return headers;
};

export const api = {
    async get(endpoint: string) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
            // Handle unauthorized - maybe logout or redirect
            // For now just throw
        }
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    async patch(endpoint: string, data: any) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    async delete(endpoint: string) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }
};
