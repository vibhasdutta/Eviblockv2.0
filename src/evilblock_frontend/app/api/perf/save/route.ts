import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, entry } = body;

        if (!sessionId || !entry) {
            return NextResponse.json({ success: false, error: 'Missing sessionId or entry' }, { status: 400 });
        }

        // Define logs directory at project root
        const logsDir = path.join(process.cwd(), 'logs');
        
        // Ensure logs directory exists
        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }

        const filePath = path.join(logsDir, `perf_session_${sessionId}.csv`);

        // Check if file exists to write headers
        let fileExists = false;
        try {
            await fs.access(filePath);
            fileExists = true;
        } catch {
            fileExists = false;
        }

        // CSV Header
        if (!fileExists) {
            const header = 'Timestamp,SessionID,Category,Label,Duration(ms),Status,Metadata\n';
            await fs.writeFile(filePath, header, 'utf-8');
        }

        // Format metadata to string
        let metadataStr = '';
        if (entry.metadata) {
            metadataStr = Object.entries(entry.metadata)
                .map(([k, v]) => `${k}=${v}`)
                .join('; ');
            // Escape quotes for CSV
            metadataStr = `"${metadataStr.replace(/"/g, '""')}"`;
        }

        // Escape label for CSV
        const safeLabel = `"${entry.label.replace(/"/g, '""')}"`;
        const safeCategory = `"${entry.category.replace(/"/g, '""')}"`;

        // CSV Row: Timestamp, SessionID, Category, Label, Duration(ms), Status, Metadata
        const row = `${entry.timestamp},${sessionId},${safeCategory},${safeLabel},${entry.duration.toFixed(2)},${entry.status},${metadataStr}\n`;

        await fs.appendFile(filePath, row, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save perf log to CSV:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
