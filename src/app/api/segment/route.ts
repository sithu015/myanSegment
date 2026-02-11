import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route — Proxy to the ML segmentation backend.
 * Forwards POST requests to http://localhost:8000/segment
 * to avoid CORS issues from the browser.
 */

const BACKEND_URL = process.env.SEGMENT_API_URL || 'http://ml-seg.ygn.app:8000/segment';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const backendResponse = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            return NextResponse.json(
                { error: `Backend error: ${backendResponse.status}`, details: errorText },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to connect to ML segmentation server', details: message },
            { status: 502 }
        );
    }
}
