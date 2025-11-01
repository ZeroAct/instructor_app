'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

type UploadMode = 'simple' | 'structured';
type OutputFormat = 'markdown' | 'json' | 'html' | 'text';

interface FloatingOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  outputFormat: OutputFormat;
  onOutputFormatChange: (format: OutputFormat) => void;
  doOcr: boolean;
  onDoOcrChange: (value: boolean) => void;
  extractTables: boolean;
  onExtractTablesChange: (value: boolean) => void;
  preserveHierarchy: boolean;
  onPreserveHierarchyChange: (value: boolean) => void;
}

export default function FloatingOptions({
  isOpen,
  onClose,
  mode,
  onModeChange,
  outputFormat,
  onOutputFormatChange,
  doOcr,
  onDoOcrChange,
  extractTables,
  onExtractTablesChange,
  preserveHierarchy,
  onPreserveHierarchyChange,
}: FloatingOptionsProps) {
  const t = useTranslations('fileUpload');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    >
      {/* Content */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Mode Selection */}
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t('mode')}
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => onModeChange('simple')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                mode === 'simple'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('simpleMode')}
            </button>
            <button
              onClick={() => onModeChange('structured')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                mode === 'structured'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('structuredMode')}
            </button>
          </div>
        </div>

        {/* Structured Mode Options */}
        {mode === 'structured' && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              {/* Output Format */}
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('outputFormat')}
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => onOutputFormatChange(e.target.value as OutputFormat)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                  <option value="text">Text</option>
                </select>
              </div>

              {/* OCR Toggle */}
              <label className="flex items-center mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doOcr}
                  onChange={(e) => onDoOcrChange(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {t('enableOcr')}
                </span>
              </label>

              {/* Extract Tables Toggle */}
              <label className="flex items-center mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractTables}
                  onChange={(e) => onExtractTablesChange(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {t('extractTables')}
                </span>
              </label>

              {/* Preserve Hierarchy Toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveHierarchy}
                  onChange={(e) => onPreserveHierarchyChange(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {t('preserveHierarchy')}
                </span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={onClose}
          className="w-full px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium"
        >
          {t('applySettings')}
        </button>
      </div>
    </div>
  );
}
