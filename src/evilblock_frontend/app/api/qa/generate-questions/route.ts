import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Q&A Generation API
 * 
 * This API route proxies requests to the Q&A generation service to bypass CORS issues.
 * The browser makes a same-origin request to this Next.js API route,
 * which then makes a server-side request to the actual Q&A API.
 */
export async function POST(request: NextRequest) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_QA_API_URL;

        if (!apiUrl) {
            return NextResponse.json(
                { success: false, error: 'Q&A API URL not configured' },
                { status: 500 }
            );
        }

        // Get the form data from the request
        const formData = await request.formData();


        // Forward the request to the Q&A API (server-to-server, no CORS issues)
        const response = await fetch(`${apiUrl}/generate-questions`, {
            method: 'POST',
            body: formData,
            // Add a timeout of 3 minutes
            signal: AbortSignal.timeout(180000),
        });


        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            return NextResponse.json(
                { success: false, error: `API returned ${response.status}: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);

        if (error instanceof Error && error.name === 'TimeoutError') {
            return NextResponse.json(
                { success: false, error: 'Request timeout - API took longer than 3 minutes' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate questions'
            },
            { status: 500 }
        );
    }
}
