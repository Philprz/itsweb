'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useState } from 'react'

const getScoreColor = (color: string) => {
  switch (color) {
    case 'green': return 'text-green-600';
    case 'orange': return 'text-orange-500';
    case 'red': return 'text-red-600';
    default: return 'text-gray-500';
  }
}

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    jira: '🟦',
    zendesk: '🟩',
    email: '✉️',
    github: '🐙',
    servicenow: '🟧',
  };
  return icons[source?.toLowerCase()] || '📄';
}

export default function DetailResultCard({ result }: { result: any }) {
  if (!result) return null;

  const {
    client,
    erp,
    created,
    updated,
    summary,
    description,
    comments,
    source_type,
    key,
    assignee,
    company_name,
    url,
    page_url,
    content,
    score,
    color
  } = result;

  const externalLink = url || page_url;
  const [expandDescription, setExpandDescription] = useState(false);
  const [expandContent, setExpandContent] = useState(false);

  return (
    <Card className="bg-white dark:bg-gray-900 border-l-4 border-blue-600 p-6 space-y-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {summary || key || 'Ticket'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            👤 <strong>{assignee || '—'}</strong> &nbsp;|&nbsp;
            🏢 <strong>{client || company_name || '—'}</strong> &nbsp;|&nbsp;
            🏷️ ERP : <strong>{erp || '—'}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            📅 {created || '—'} — 🔄 {updated || '—'}
          </p>
        </div>

        {externalLink && (
          <Link href={externalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
            🔗 Voir dans {source_type || 'source'}
          </Link>
        )}
      </div>

      {description && (
        <div className="space-y-1">
          <p className="font-medium text-sm">📌 Description</p>
          <div className={`text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200 ${expandDescription ? '' : 'line-clamp-5'}`}>
            {description}
          </div>
          {description.length > 300 && !expandDescription && (
            <button onClick={() => setExpandDescription(true)} className="text-xs text-blue-600 hover:underline">
              Afficher plus
            </button>
          )}
        </div>
      )}

      {content && (
        <div className="space-y-1">
          <p className="font-medium text-sm">📄 Contenu</p>
          <div className={`text-sm italic text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${expandContent ? '' : 'line-clamp-5'}`}>
            {content}
          </div>
          {content.length > 300 && !expandContent && (
            <button onClick={() => setExpandContent(true)} className="text-xs text-blue-600 hover:underline">
              Afficher plus
            </button>
          )}
        </div>
      )}

      {comments && (
        <blockquote className="text-sm text-gray-500 italic border-l-4 pl-4 border-gray-300">
          💬 {comments}
        </blockquote>
      )}

      <div className="flex justify-between items-center text-sm">
        <p className="text-gray-700 dark:text-gray-200">
          📁 Source : <strong>{getSourceIcon(source_type)} {source_type || '—'}</strong>
        </p>
        {score !== undefined && (
          <p>
            🎯 Score : <span className={`font-semibold ${getScoreColor(color)}`}>{score}</span>
          </p>
        )}
      </div>
    </Card>
  );
}