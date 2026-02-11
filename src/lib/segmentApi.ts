/**
 * ML Word Segmentation API Service
 * 
 * Communicates with the backend FastAPI server at /api/segment (proxied)
 * for ML-based Myanmar word segmentation.
 */

const API_BASE = '/api/segment';

export interface SegmentResponse {
    segmented_text: string;
}

/**
 * Segment a single text using the ML backend API.
 * Returns an array of segmented words/tokens.
 */
export async function segmentTextML(text: string): Promise<string[]> {
    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error(`ML Segmentation API error: ${response.status} ${response.statusText}`);
    }

    const data: SegmentResponse = await response.json();
    // The backend returns segmented_text with spaces between segments
    const segments = data.segmented_text
        .split(/\s+/)
        .filter((s: string) => s.length > 0);
    return segments;
}

/**
 * Segment multiple lines of text using the ML backend API.
 * Calls the API for each line and returns arrays of segments.
 */
export async function segmentBatchML(texts: string[]): Promise<string[][]> {
    // Process in parallel with concurrency limit to avoid overwhelming the server
    const CONCURRENCY = 5;
    const results: string[][] = new Array(texts.length);

    for (let i = 0; i < texts.length; i += CONCURRENCY) {
        const batch = texts.slice(i, i + CONCURRENCY);
        const promises = batch.map((text, idx) =>
            segmentTextML(text).then(segments => {
                results[i + idx] = segments;
            })
        );
        await Promise.all(promises);
    }

    return results;
}

/**
 * Check if the ML segmentation backend is reachable.
 */
export async function checkMLServerHealth(): Promise<boolean> {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ text: 'test' }),
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}
