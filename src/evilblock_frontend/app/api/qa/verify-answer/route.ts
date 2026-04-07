import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Q&A Verification API
 */
export async function POST(request: NextRequest) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_QA_API_URL;
        const apiKey = process.env.API_KEY;

        if (!apiUrl || !apiKey) {
            return NextResponse.json(
                { success: false, error: 'Q&A API configuration missing' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const targetUrl = `${apiUrl}/api/v1/verify-answer`;

        console.log(`🔍 Proxying verification request to: ${targetUrl}`);
        console.log(`📦 Request body:`, JSON.stringify(body));

        // Forward to the FastAPI verification endpoint
        const response = await fetch(targetUrl, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
