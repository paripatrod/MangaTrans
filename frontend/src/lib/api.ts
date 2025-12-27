const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
    method?: string;
    body?: unknown;
    token?: string;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

// Auth API
export const authApi = {
    syncUser: (data: { email: string; name?: string; image?: string; provider?: string }) =>
        apiRequest<{ success: boolean; user: UserProfile }>('/auth/sync', { method: 'POST', body: data }),

    getProfile: (email: string) =>
        apiRequest<UserProfile>(`/auth/profile/${encodeURIComponent(email)}`),

    upgradeMembership: (email: string, plan: '7days' | '30days') =>
        apiRequest<{ success: boolean; membershipType: string; remainingDays: number }>('/auth/upgrade', { method: 'POST', body: { email, plan } }),
};

// Translate API
export const translateApi = {
    start: (data: { url: string; sourceLang: string; targetLang: string; title?: string }, token?: string) =>
        apiRequest<{ success: boolean; jobId: string }>('/translate/start', { method: 'POST', body: data, token }),

    getStatus: (jobId: string) =>
        apiRequest<{ status: string; progress: number; message: string; pages: unknown[] }>(`/translate/status/${jobId}`),

    uploadImages: async (files: File[], sourceLang: string, targetLang: string, token?: string) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });
        formData.append('sourceLang', sourceLang);
        formData.append('targetLang', targetLang);

        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/translate/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return response.json() as Promise<{ success: boolean; jobId: string; totalPages: number }>;
    },
};

// History API
export const historyApi = {
    getHistory: (email: string, page = 1, limit = 10) =>
        apiRequest<{ translations: Translation[]; total: number }>(`/history/${encodeURIComponent(email)}?page=${page}&limit=${limit}`),

    getDetail: (jobId: string) =>
        apiRequest<Translation>(`/history/detail/${jobId}`),

    delete: (jobId: string) =>
        apiRequest<{ success: boolean }>(`/history/${jobId}`, { method: 'DELETE' }),
};

// Types
export interface Translation {
    _id: string;
    url: string;
    sourceLang: string;
    targetLang: string;
    status: string;
    pageCount: number;
    pages: Page[];
    createdAt: string;
}

export interface Page {
    pageNumber: number;
    originalUrl: string;
    translatedUrl: string | null;
}

// Types
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    image: string;
    membershipType: 'free' | '7days' | '30days' | 'admin';
    membershipExpiry: string | null;
    isMember: boolean;
    remainingDays: number;
    translationCount: number;
    remainingTranslations: number;
    cooldownEndsAt: string | null;
    createdAt: string;
    lastLogin: string;
}

export { API_BASE_URL };
