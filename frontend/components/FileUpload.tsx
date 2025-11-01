'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import DocumentViewer from './DocumentViewer';
import FloatingOptions from './FloatingOptions';

type UploadMode = 'simple' | 'structured';
type OutputFormat = 'markdown' | 'json' | 'html' | 'text';

interface FileUploadProps {
  onFileUploaded: (text: string, filename: string) => void;
  disabled?: boolean;
}

interface ParsedDocument {
  doc_id: string;
  filename: string;
  formats: Record<string, string>;
  metadata?: any;
}

export default function FileUpload({ onFileUploaded, disabled = false }: FileUploadProps) {
  const t = useTranslations('fileUpload');
  const tCommon = useTranslations('common');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('simple');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [doOcr, setDoOcr] = useState(true);
  const [extractTables, setExtractTables] = useState(true);
  const [preserveHierarchy, setPreserveHierarchy] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      let url = `${API_BASE_URL}/api/file/parse`;
      const params = new URLSearchParams();
      
      if (uploadMode === 'structured') {
        params.append('do_ocr', doOcr.toString());
        params.append('extract_tables', extractTables.toString());
        params.append('preserve_hierarchy', preserveHierarchy.toString());
      }
      
      if (params.toString()) {
        url += `?${params}`;
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
      
      if (data.success && data.formats) {
        // Store parsed document
        setParsedDoc({
          doc_id: data.doc_id,
          filename: data.filename,
          formats: data.formats,
          metadata: data.metadata,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setParsedDoc(null);
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
  }, [uploadMode, doOcr, extractTables, preserveHierarchy]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInsertText = (text: string) => {
    if (parsedDoc) {
      onFileUploaded(text, parsedDoc.filename);
    }
  };

  const handleFormatSwitch = async (format: OutputFormat) => {
    if (!parsedDoc) return;
    
    // Check if format is already in cache
    if (format in parsedDoc.formats) {
      setOutputFormat(format);
      return;
    }
    
    // Fetch format from server
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/file/export/${parsedDoc.doc_id}?output_format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to export format');
      }
      
      const data = await response.json();
      
      // Update cached formats
      setParsedDoc({
        ...parsedDoc,
        formats: {
          ...parsedDoc.formats,
          [format]: data.text,
        },
      });
      setOutputFormat(format);
    } catch (err: any) {
      setError(err.message || 'Failed to switch format');
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Upload Button with Options */}
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
          accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.html,.md,.jpg,.jpeg,.png,.bmp,.gif,.tiff,.webp"
        />
        
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded transition-colors inline-flex items-center space-x-1"
        >
          <span>{isUploading ? t('uploading') : t('uploadButton')}</span>
        </button>

        <button
          onClick={() => setShowOptions(true)}
          disabled={disabled}
          className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
          title={t('settings')}
        >
          <Settings className="w-4 h-4" />
        </button>

        {uploadMode === 'structured' && (
          <span className="text-xs text-gray-500">
            {t('mode')}: {t(uploadMode + 'Mode')} | {t('format')}: {outputFormat.toUpperCase()}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Document Viewer */}
      {parsedDoc && (
        <DocumentViewer
          doc_id={parsedDoc.doc_id}
          filename={parsedDoc.filename}
          formats={parsedDoc.formats}
          onInsert={handleInsertText}
        />
      )}

      {/* Floating Options Panel */}
      <FloatingOptions
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        mode={uploadMode}
        onModeChange={setUploadMode}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
        doOcr={doOcr}
        onDoOcrChange={setDoOcr}
        extractTables={extractTables}
        onExtractTablesChange={setExtractTables}
        preserveHierarchy={preserveHierarchy}
        onPreserveHierarchyChange={setPreserveHierarchy}
      />
    </div>
  );
}
