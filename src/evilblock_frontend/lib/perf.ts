/**
 * Performance Tracking Utility
 * Uses performance.now() to measure latency across all operations.
 * 
 * Usage:
 *   const end = perf.start('IPFS Upload');
 *   await doWork();
 *   end();  // logs + records the duration
 * 
 * Or wrap an async function:
 *   const result = await perf.track('Blockchain Store', () => storeDoc(...));
 * 
 * View all logs:
 *   perf.printSummary();
 *   perf.getLogs();
 */

export interface PerfEntry {
  label: string;
  category: string;
  startTime: number;
  duration: number;
  status: 'success' | 'error';
  timestamp: string;
  metadata?: Record<string, string | number>;
}

// Categories for grouping operations
export const PerfCategory = {
  AUTH: '🔐 Auth',
  BLOCKCHAIN: '⛓️ Blockchain',
  IPFS: '📦 IPFS',
  ENCRYPTION: '🔒 Encryption',
  QA_API: '🧠 QA API',
  FILE_STORAGE: '💾 File Storage',
  FIREBASE: '🔥 Firebase',
  VIDEO: '🎥 Video',
  NETWORK: '🌐 Network',
} as const;

type PerfCategoryValue = (typeof PerfCategory)[keyof typeof PerfCategory];

const logs: PerfEntry[] = [];

// Generate or retrieve a session ID for logging
let sessionId = 'unknown-session';
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('perfSessionId') || '';
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem('perfSessionId', sessionId);
  }
}

// Color-coded console styles
const STYLES = {
  label:    'color: #8B5CF6; font-weight: bold',
  time:     'color: #10B981; font-weight: bold',
  slowTime: 'color: #EF4444; font-weight: bold',
  category: 'color: #6B7280; font-style: italic',
  error:    'color: #EF4444; font-weight: bold',
  header:   'color: #F59E0B; font-weight: bold; font-size: 14px',
  reset:    '',
};

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

/**
 * Start a performance timer. Returns a function to call when the operation finishes.
 */
function start(
  label: string,
  category: PerfCategoryValue = PerfCategory.NETWORK,
  metadata?: Record<string, string | number>
): (status?: 'success' | 'error') => PerfEntry {
  const startTime = performance.now();

  return (status: 'success' | 'error' = 'success') => {
    const duration = performance.now() - startTime;
    const entry: PerfEntry = {
      label,
      category,
      startTime,
      duration,
      status,
      timestamp: new Date().toISOString(),
      metadata,
    };
    logs.push(entry);

    const isSlow = duration > 2000;
    const timeStyle = status === 'error' ? STYLES.error : isSlow ? STYLES.slowTime : STYLES.time;
    const icon = status === 'error' ? '❌' : isSlow ? '🐢' : '✅';

    console.log(
      `%c[PERF]%c ${category} %c${label}%c → %c${formatDuration(duration)}%c ${icon}`,
      STYLES.header, STYLES.category, STYLES.label, STYLES.reset, timeStyle, STYLES.reset
    );

    if (metadata) {
      const metaStr = Object.entries(metadata).map(([k, v]) => `${k}=${v}`).join(', ');
      console.log(`       %c${metaStr}`, STYLES.category);
    }

    // Fire and forget to save to CSV server-side
    if (typeof window !== 'undefined') {
      fetch('/api/perf/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, entry }),
      }).catch(err => console.error('[PERF] Failed to save log to CSV:', err));
    }

    return entry;
  };
}

/**
 * Wrap an async operation with performance tracking.
 */
async function track<T>(
  label: string,
  category: PerfCategoryValue,
  fn: () => Promise<T>,
  metadata?: Record<string, string | number>
): Promise<T> {
  const end = start(label, category, metadata);
  try {
    const result = await fn();
    end('success');
    return result;
  } catch (error) {
    end('error');
    throw error;
  }
}

/**
 * Get all recorded performance logs.
 */
function getLogs(): PerfEntry[] {
  return [...logs];
}

/**
 * Get logs filtered by category.
 */
function getLogsByCategory(category: PerfCategoryValue): PerfEntry[] {
  return logs.filter(l => l.category === category);
}

/**
 * Clear all logs.
 */
function clearLogs(): void {
  logs.length = 0;
}

/**
 * Print a formatted summary table to the console.
 */
function printSummary(): void {
  if (logs.length === 0) {
    console.log('%c[PERF] No performance data recorded yet.', STYLES.header);
    return;
  }

  console.log('%c\n╔════════════════════════════════════════════════════════════╗', STYLES.header);
  console.log('%c║              PERFORMANCE SUMMARY                          ║', STYLES.header);
  console.log('%c╚════════════════════════════════════════════════════════════╝', STYLES.header);

  // Group by category
  const grouped: Record<string, PerfEntry[]> = {};
  for (const entry of logs) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }

  for (const [category, entries] of Object.entries(grouped)) {
    console.log(`\n%c${category}`, STYLES.label);
    console.log('%c' + '─'.repeat(55), STYLES.category);

    for (const entry of entries) {
      const isSlow = entry.duration > 2000;
      const icon = entry.status === 'error' ? '❌' : isSlow ? '🐢' : '✅';
      const timeStyle = entry.status === 'error' ? STYLES.error : isSlow ? STYLES.slowTime : STYLES.time;

      console.log(
        `  ${icon} %c${entry.label.padEnd(35)}%c ${formatDuration(entry.duration)}`,
        STYLES.reset,
        timeStyle
      );
    }

    // Category stats
    const successEntries = entries.filter(e => e.status === 'success');
    if (successEntries.length > 0) {
      const avg = successEntries.reduce((sum, e) => sum + e.duration, 0) / successEntries.length;
      const max = Math.max(...successEntries.map(e => e.duration));
      const min = Math.min(...successEntries.map(e => e.duration));
      console.log(
        `  %c   Avg: ${formatDuration(avg)}  |  Min: ${formatDuration(min)}  |  Max: ${formatDuration(max)}`,
        STYLES.category
      );
    }
  }

  // Totals
  const totalTime = logs.reduce((sum, e) => sum + e.duration, 0);
  const errorCount = logs.filter(e => e.status === 'error').length;
  console.log(`\n%c  Total: ${formatDuration(totalTime)} across ${logs.length} operations (${errorCount} errors)`, STYLES.header);
}

/**
 * Export a JSON report of all performance data.
 */
function exportReport(): string {
  return JSON.stringify({
    generated: new Date().toISOString(),
    totalOperations: logs.length,
    totalDuration: logs.reduce((sum, e) => sum + e.duration, 0),
    entries: logs,
  }, null, 2);
}

// Expose globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).__perf = {
    getLogs,
    printSummary,
    clearLogs,
    exportReport,
  };
}

export const perf = {
  start,
  track,
  getLogs,
  getLogsByCategory,
  clearLogs,
  printSummary,
  exportReport,
  PerfCategory,
};

export default perf;
