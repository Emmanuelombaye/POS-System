const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getStoredToken = () => {
    try {
        const directToken = localStorage.getItem('token');
        if (directToken) return directToken;

        const persistedState = localStorage.getItem('eden-drop-001-state');
        if (persistedState) {
            const { state } = JSON.parse(persistedState);
            if (state?.token) return state.token as string;
        }
    } catch (e) {
        console.error("Error reading token from localStorage", e);
    }

    return undefined;
};

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = getStoredToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

const buildQueryString = (params?: Record<string, string | number | boolean | undefined>) => {
    if (!params) return "";
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return entries.length ? `?${entries.join("&")}` : "";
};

export const api = {
    async get(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
        const query = buildQueryString(params);
        const res = await fetch(`${API_URL}${endpoint}${query}`, {
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
        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error) errorMessage = errorBody.error;
            } catch (_err) {
                // ignore json parsing errors
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async patch(endpoint: string, data: any) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error) errorMessage = errorBody.error;
            } catch (_err) {
                // ignore json parsing errors
            }
            throw new Error(errorMessage);
        }
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
