'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type ViewerFormat = 'text' | 'markdown' | 'html' | 'json';

interface DocumentViewerProps {
  doc_id: string;
  filename: string;
  formats: Record<string, string>;
  onEdit?: (text: string) => void;
  onInsert?: (text: string) => void;
}

export default function DocumentViewer({
  doc_id,
  filename,
  formats,
  onEdit,
  onInsert,
}: DocumentViewerProps) {
  const t = useTranslations('documentViewer');
  const [activeFormat, setActiveFormat] = useState<ViewerFormat>('markdown');
  const [editedText, setEditedText] = useState<string>(formats.text || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = activeFormat === 'text' ? editedText : formats[activeFormat] || '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    const content = activeFormat === 'text' ? editedText : formats[activeFormat] || '';
    onInsert?.(content);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEditedText(newText);
    onEdit?.(newText);
  };

  const renderContent = () => {
    switch (activeFormat) {
      case 'text':
        return (
          <textarea
            className="w-full h-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 resize-y"
            value={editedText}
            onChange={handleTextChange}
            placeholder="Extracted text will appear here..."
          />
        );
      
      case 'markdown':
        return (
          <div className="w-full h-full min-h-[400px] p-4 overflow-auto border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formats.markdown ? markdownToHtml(formats.markdown) : '<p class="text-gray-500">No markdown content</p>' 
              }}
            />
          </div>
        );
      
      case 'html':
        return (
          <div className="w-full h-full min-h-[400px] p-4 overflow-auto border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formats.html || '<p class="text-gray-500">No HTML content</p>' 
              }}
            />
          </div>
        );
      
      case 'json':
        return (
          <div className="w-full h-full min-h-[400px] p-4 overflow-auto border border-gray-300 dark:border-gray-600 rounded bg-gray-900">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {formats.json || '{}'}
            </pre>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{filename}</h3>
          <p className="text-sm text-gray-500">Document ID: {doc_id}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
          >
            {copied ? t('copied') : t('copy')}
          </button>
          <button
            onClick={handleInsert}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            {t('insert')}
          </button>
        </div>
      </div>

      {/* Format Tabs */}
      <div className="flex space-x-1 border-b border-gray-300 dark:border-gray-600">
        {(['text', 'markdown', 'html', 'json'] as ViewerFormat[]).map((format) => (
          <button
            key={format}
            onClick={() => setActiveFormat(format)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeFormat === format
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t(format)}
            {format === 'text' && ' (editable)'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500">
        {activeFormat === 'text' && (
          <p>{t('textEditable')}</p>
        )}
        {activeFormat !== 'text' && (
          <p>{t('switchFormats')}</p>
        )}
      </div>
    </div>
  );
}

// Simple markdown to HTML converter (basic implementation)
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Tables (basic)
  html = html.replace(/\|(.*?)\|/g, (match) => {
    const cells = match.split('|').filter(Boolean);
    return '<tr>' + cells.map(cell => `<td>${cell.trim()}</td>`).join('') + '</tr>';
  });
  
  return html;
}
