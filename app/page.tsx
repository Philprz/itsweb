'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, Database, FileText, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import GptResultCard from '@/components/GptResultCard'
import DetailResultCard from '@/components/DetailResultCard'
import MetaBadge from '@/components/MetaBadge'
import LoaderMessage from '@/components/LoaderMessage'
import SummaryCard from '@/components/SummaryCard'
import Image from 'next/image';

export default function Home() {
  const [query, setQuery] = useState('')
  const [client, setClient] = useState('')
  const [clients, setClients] = useState<string[]>([])
  const [erp, setErp] = useState('')
  const [format, setFormat] = useState('Summary')
  const [recentOnly, setRecentOnly] = useState(true)
  const [raw, setRaw] = useState(false)
  const [limit, setLimit] = useState('5')
  const [results, setResults] = useState<any[]>([])
  const [sources, setSources] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients')
        const data = await res.json()
        if (Array.isArray(data.clients)) {
          const sorted = data.clients.filter(Boolean).sort((a, b) => a.localeCompare(b))
          setClients(sorted)
        }
      } catch (err) {
        console.error('Erreur chargement clients', err)
      }
    }

    fetchClients()
  }, [])

  const handleSearch = async () => {
    if (!query) {
      setError('Veuillez entrer une requête de recherche');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, client, erp, format, recentOnly, limit: parseInt(limit), raw }),
      });

      const data = await response.json();
      const content = data.content;

      setResults(Array.isArray(content) ? content : [content]);
      setSources(data.sources || '');
      setMeta(data.meta || null);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
      setSources('');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 flex items-center justify-between rounded-b-lg border-b">
        <div className="flex items-center space-x-4">
          <Image src="/it_spirit_logo.jfif" alt="Logo ITSpirit" width={64} height={64} className="rounded-md" priority />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">ITS Help</h1>
        </div>
      </header>

      <div className="p-4 sm:p-8">
        <Card className="search-form p-6 mb-8">
          <Label htmlFor="query" className="text-lg font-medium">Requête</Label>
          <div className="flex gap-2 mt-1">
            <Input id="query" placeholder="Entrez votre requête..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="text-base" />
            <Button onClick={handleSearch} disabled={isLoading} className="search-button">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />} Rechercher
            </Button>
          </div>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="mt-4">
            {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
          </Button>

          {showFilters && (
            <div className="filter-section mt-4">
              {/* Filtres client, ERP, format, etc. */}
            </div>
          )}
        </Card>

        {isLoading && <Card className="mb-8"><LoaderMessage /></Card>}
        {error && <Card className="error-message p-4 mb-8"><p>{error}</p></Card>}

        {results.length > 0 && (
          <Card className="results-section p-4">
            <div className="results-header">
              <h2 className="results-count">Résultats ({results.length})</h2>
              {sources && <p className="results-sources">Sources: {sources}</p>}
            </div>

            {meta && <MetaBadge meta={meta} />}

            <ScrollArea className="h-[400px]">
              {format === 'Summary' && results.map((r, i) => <SummaryCard key={i} content={r} format={format} isGpt={meta?.mode === 'deepresearch'} />)}
              {format === 'Detail' && results.map((r, i) => <DetailResultCard key={i} result={r} />)}
              {format === 'Guide' && results.map((r, i) => <GptResultCard key={i} content={r} />)}
            </ScrollArea>

            <div className="question-client-block">
              <p className="text-sm font-medium mb-2">Est-ce que votre question porte sur un client en particulier ?</p>
              <Select value={client} onValueChange={setClient}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
