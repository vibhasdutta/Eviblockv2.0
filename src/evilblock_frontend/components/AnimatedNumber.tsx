'use client';
import React, { useEffect, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { getTotalDocuments } from '@/lib/canister';

export function NumberWithDiff({
  value,
}: {
  value: number;
}) {
  return (
    <NumberFlow
      value={value}
      className='text-2xl font-semibold'
      format={{
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }}
    />
  );
}

export default function AnimatedNumberDemo() {
  const [totalFiles, setTotalFiles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total files count
        const filesCount = await getTotalDocuments();
        setTotalFiles(filesCount);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default values on error
        setTotalFiles(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Files Uploaded', value: totalFiles },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-muted-foreground mb-2 font-medium">{stat.label}</div>
              {loading ? (
                <div className="text-2xl font-semibold text-muted-foreground">Loading...</div>
              ) : (
                <NumberWithDiff value={stat.value} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { NumberWithDiff, AnimatedNumberDemo };