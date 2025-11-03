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
      // Step 1: Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/api/file/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.file_id;
      const filename = uploadData.filename;

      // Step 2: Parse file (simple or structured)
      let parseUrl = `${API_BASE_URL}/api/file/parse${uploadMode === 'structured' ? '-structured' : ''}/${fileId}`;
      
      if (uploadMode === 'structured') {
        const params = new URLSearchParams({
          do_ocr: doOcr.toString(),
          extract_tables: extractTables.toString(),
          preserve_hierarchy: preserveHierarchy.toString(),
        });
        parseUrl += `?${params}`;
      }

      const parseResponse = await fetch(parseUrl, {
        method: 'POST',
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.detail || 'Failed to parse file');
      }

      const parseData = await parseResponse.json();
      
      if (uploadMode === 'simple') {
        // Simple mode: just text
        if (parseData.success && parseData.text) {
          onFileUploaded(parseData.text, filename);
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // Structured mode: multiple formats
        if (parseData.success && parseData.formats) {
          // Store parsed document
          setParsedDoc({
            doc_id: fileId,
            filename: filename,
            formats: parseData.formats,
          });
          
          // Auto-insert the default format immediately
          const defaultText = parseData.formats[outputFormat] || parseData.formats.text || '';
          onFileUploaded(defaultText, filename);
        } else {
          throw new Error('Invalid response from server');
        }
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
    
    // Fetch format from server using export endpoint
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/file/export/${parsedDoc.doc_id}?format=${format}`
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
          [format]: data.content,
        },
      });
      setOutputFormat(format);
    } catch (err: any) {
      setError(err.message || 'Failed to switch format');
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Upload Button with Dropdown Options */}
      <div className="relative inline-block">
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
            onClick={() => setShowOptions(!showOptions)}
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

        {/* Dropdown Options Panel (Dropbox style) */}
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

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Document Viewer (Optional - for viewing/switching formats) */}
      {parsedDoc && (
        <DocumentViewer
          doc_id={parsedDoc.doc_id}
          filename={parsedDoc.filename}
          formats={parsedDoc.formats}
          onInsert={handleInsertText}
        />
      )}
    </div>
  );
}
