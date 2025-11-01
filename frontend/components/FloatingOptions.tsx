'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Floating Panel */}
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{t('uploadOptions')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('mode')}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => onModeChange('simple')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                  mode === 'simple'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('simpleMode')}
              </button>
              <button
                onClick={() => onModeChange('structured')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                  mode === 'structured'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('structuredMode')}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {mode === 'simple' ? t('simpleModeDescription') : t('structuredModeDescription')}
            </p>
          </div>

          {/* Structured Mode Options */}
          {mode === 'structured' && (
            <>
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('outputFormat')}
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => onOutputFormatChange(e.target.value as OutputFormat)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                  <option value="text">Text</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {t('outputFormatDescription')}
                </p>
              </div>

              {/* OCR Toggle */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="doOcr"
                  checked={doOcr}
                  onChange={(e) => onDoOcrChange(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <label htmlFor="doOcr" className="text-sm font-medium cursor-pointer">
                    {t('enableOcr')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('enableOcrDescription')}
                  </p>
                </div>
              </div>

              {/* Extract Tables Toggle */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="extractTables"
                  checked={extractTables}
                  onChange={(e) => onExtractTablesChange(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <label htmlFor="extractTables" className="text-sm font-medium cursor-pointer">
                    {t('extractTables')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('extractTablesDescription')}
                  </p>
                </div>
              </div>

              {/* Preserve Hierarchy Toggle */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="preserveHierarchy"
                  checked={preserveHierarchy}
                  onChange={(e) => onPreserveHierarchyChange(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <label htmlFor="preserveHierarchy" className="text-sm font-medium cursor-pointer">
                    {t('preserveHierarchy')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('preserveHierarchyDescription')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium"
          >
            {t('applySettings')}
          </button>
        </div>
      </div>
    </>
  );
}
