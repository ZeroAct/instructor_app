'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SchemaDefinition } from '@/types/schema';
import { exportResult } from '@/lib/api';

interface ResultsStepProps {
  result: any;
  schema: SchemaDefinition;
  onPrevious: () => void;
  onReset: () => void;
}

export default function ResultsStep({
  result,
  schema,
  onPrevious,
  onReset,
}: ResultsStepProps) {
  const t = useTranslations('resultsStep');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      const data = await exportResult(result, format, schema.name);
      const blob = new Blob([data.content], { type: data.media_type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExportMessage(`✓ Exported as ${data.filename}`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error: any) {
      setExportMessage(`✗ Export failed: ${error.message}`);
    }
  };

  const renderFormattedResult = (data: any, depth = 0) => {
    if (data === null || data === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof data === 'string') {
      return <span className="text-green-700">&quot;{data}&quot;</span>;
    }

    if (typeof data === 'number') {
      return <span className="text-blue-700">{data}</span>;
    }

    if (typeof data === 'boolean') {
      return <span className="text-purple-700">{data.toString()}</span>;
    }

    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          {data.map((item, index) => (
            <div key={index} className="my-2 p-3 bg-gray-50 rounded border-l-2 border-purple-400">
              <div className="text-xs text-gray-500 mb-1">Item {index + 1}</div>
              {renderFormattedResult(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof data === 'object') {
      return (
        <div className={depth === 0 ? '' : 'ml-4'}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="my-2">
              <div className="flex items-start gap-3">
                <span className="font-semibold text-purple-600 min-w-[120px]">{key}:</span>
                <div className="flex-1">{renderFormattedResult(value, depth + 1)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(data)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">📊 {t('title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('formatted')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              viewMode === 'formatted'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('formatted')}
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              viewMode === 'raw'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('rawJson')}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">Success!</strong> Your structured data has been extracted. Toggle between formatted and raw JSON views.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {viewMode === 'formatted' ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-3">Formatted View</div>
            {renderFormattedResult(result)}
          </div>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>

      {exportMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            exportMessage.startsWith('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {exportMessage}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleExport('json')}
          className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
        >
          📥 {t('export')} JSON
        </button>
        <button
          onClick={() => handleExport('markdown')}
          className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
        >
          📝 {t('export')} Markdown
        </button>
      </div>

      <div className="flex justify-between pt-3 border-t">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          ← {t('previous')}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          🔄 {t('startOver')}
        </button>
      </div>
    </div>
  );
}
