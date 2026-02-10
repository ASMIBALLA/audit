'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataProcessorProps {
  onSuccess: () => void;
}

export default function DataProcessor({ onSuccess }: DataProcessorProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleProcessData = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8001/automation/process-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus('success');
      setMessage(
        `${data.message} - ${data.suppliers_processed} suppliers processed, ${data.trips_audited} trips audited`
      );
      onSuccess();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to process data. Make sure the FastAPI backend is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleProcessData}
        disabled={loading}
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {loading ? 'Processing Data...' : 'Process All Data'}
      </Button>

      {status === 'success' && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Success!</p>
            <p className="text-sm text-green-800">{message}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800">{message}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600">
        This will read the synthetic data and calculate carbon emissions for all suppliers based on their vehicle trips and GPS coordinates.
      </p>
    </div>
  );
}
