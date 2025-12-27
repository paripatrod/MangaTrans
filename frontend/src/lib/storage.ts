// ========================================
// Local Storage Utility for Translation History
// Saves translations client-side for privacy & speed
// ========================================

export interface TranslationPage {
    pageNumber: number;
    originalUrl: string;
    translatedUrl: string;
}

export interface TranslationHistory {
    id: string;
    title: string;
    sourceUrl: string;
    sourceLang: string;
    targetLang: string;
    pageCount: number;
    pages: TranslationPage[];
    createdAt: string;
}

const STORAGE_KEY = 'mangatrans_history';
const COUNT_KEY = 'mangatrans_total_count';

/**
 * Get all translations from localStorage
 */
export function getHistory(): TranslationHistory[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Save a new translation to history
 */
export function saveTranslation(translation: Omit<TranslationHistory, 'id' | 'createdAt'>): TranslationHistory {
    const history = getHistory();

    const newEntry: TranslationHistory = {
        ...translation,
        id: generateId(),
        createdAt: new Date().toISOString()
    };

    // Add to beginning (most recent first)
    history.unshift(newEntry);

    // Keep only last 50 translations to save space
    const trimmed = history.slice(0, 50);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    // Update total count
    incrementCount();

    return newEntry;
}

/**
 * Delete a translation from history
 */
export function deleteTranslation(id: string): void {
    const history = getHistory();
    const filtered = history.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all history
 */
export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get total translation count (lifetime)
 */
export function getTotalCount(): number {
    if (typeof window === 'undefined') return 0;

    try {
        const count = localStorage.getItem(COUNT_KEY);
        return count ? parseInt(count, 10) : 0;
    } catch {
        return 0;
    }
}

/**
 * Increment total count
 */
function incrementCount(): void {
    const current = getTotalCount();
    localStorage.setItem(COUNT_KEY, String(current + 1));
}

/**
 * Generate unique ID
 */
function generateId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract title from URL
 */
export function extractTitleFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        // Common patterns for manga URLs
        // /manga/title-chapter-1/ → "Title Chapter 1"
        // /read/title/chapter-1/ → "Title"

        const segments = path.split('/').filter(s => s.length > 0);

        // Find the most "title-like" segment
        for (const seg of segments) {
            if (seg.includes('chapter') || seg.includes('ep') || seg.length > 10) {
                // Clean up the segment
                return seg
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .replace(/\bchapter\b/gi, 'Ch.')
                    .replace(/\bep\b/gi, 'Ep.')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                    .substring(0, 50); // Limit length
            }
        }

        // Fallback: use hostname
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Unknown Title';
    }
}
