'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { API_BASE_URL } from '@/lib/api';

type UploadMode = 'simple' | 'structured';
type OutputFormat = 'markdown' | 'json' | 'html' | 'text';

interface FileUploadProps {
  onFileUploaded: (text: string, filename: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileUploaded, disabled = false }: FileUploadProps) {
  const t = useTranslations('fileUpload');
  const tCommon = useTranslations('common');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('simple');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [doOcr, setDoOcr] = useState(true);
  const [extractTables, setExtractTables] = useState(true);
  const [preserveHierarchy, setPreserveHierarchy] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setExtractedText('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      let url = `${API_BASE_URL}/api/file/upload`;
      if (uploadMode === 'structured') {
        const params = new URLSearchParams({
          output_format: outputFormat,
          do_ocr: doOcr.toString(),
          extract_tables: extractTables.toString(),
          preserve_hierarchy: preserveHierarchy.toString(),
        });
        url = `${API_BASE_URL}/api/file/upload-structured?${params}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        setUploadedFile(data.filename);
        setExtractedText(data.text);
        if (!showPreview) {
          // Immediately update if not in preview mode
          onFileUploaded(data.text, data.filename);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setUploadedFile(null);
      setExtractedText('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadMode, outputFormat, doOcr, extractTables, preserveHierarchy, showPreview]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUseText = () => {
    if (extractedText && uploadedFile) {
      onFileUploaded(extractedText, uploadedFile);
      setShowPreview(false);
    }
  };

  return (
    <div className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.gif,.tiff,.csv,.xlsx,.xls,.json,.xml,.html,.md,.rtf"
      />
      
      <button
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('uploading') || 'Uploading...'}
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {t('uploadButton') || 'Upload File'}
          </>
        )}
      </button>

      {/* Upload Configuration Modal/Popover */}
      {!isUploading && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('uploadMode') || 'Upload Mode'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadMode('simple')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${
                  uploadMode === 'simple'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('simpleMode') || 'Simple'}
              </button>
              <button
                onClick={() => setUploadMode('structured')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${
                  uploadMode === 'structured'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('structuredMode') || 'Structured'}
              </button>
            </div>
          </div>

          {/* Structured Mode Options */}
          {uploadMode === 'structured' && (
            <>
              {/* Output Format */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t('outputFormat') || 'Output Format'}
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                  <option value="text">Text</option>
                </select>
              </div>

              {/* Toggle Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doOcr}
                    onChange={(e) => setDoOcr(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-xs text-gray-700">{t('enableOcr') || 'Enable OCR'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extractTables}
                    onChange={(e) => setExtractTables(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-xs text-gray-700">{t('extractTables') || 'Extract Tables'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveHierarchy}
                    onChange={(e) => setPreserveHierarchy(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-xs text-gray-700">{t('preserveHierarchy') || 'Preserve Hierarchy'}</span>
                </label>
              </div>
            </>
          )}

          {/* Preview Toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
            />
            <span className="text-xs text-gray-700">{t('showPreview') || 'Show preview before inserting'}</span>
          </label>
        </div>
      )}

      {/* Status Messages */}
      {uploadedFile && !error && !showPreview && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="flex-1">
            {t('uploadSuccess') || 'File uploaded successfully'}: <strong>{uploadedFile}</strong>
          </span>
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && extractedText && uploadedFile && (
        <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              {t('preview') || 'Preview'}: {uploadedFile}
            </span>
            <button
              onClick={handleUseText}
              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              {t('useText') || 'Use This Text'}
            </button>
          </div>
          <div className="p-3 max-h-60 overflow-y-auto bg-white">
            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">{extractedText}</pre>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">{tCommon('error') || 'Error'}</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
