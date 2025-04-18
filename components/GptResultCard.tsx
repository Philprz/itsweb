'use client'

import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function GptResultCard({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-yellow-50 dark:bg-yellow-100 border-l-4 border-yellow-400 p-6 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold text-yellow-900">🧠 Résultat généré automatiquement</h3>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
        >
          {copied ? '✅ Copié !' : '📝 Copier'}
        </button>
      </div>
      <div className="text-sm whitespace-pre-wrap text-gray-800">{content}</div>
    </Card>
  );
}
