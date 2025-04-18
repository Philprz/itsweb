'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, Database, FileText, BookOpen } from 'lucide-react'
import { useState } from 'react'
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

  const handleSearch = async () => {
    if (!query) {
      setError('Veuillez entrer une requête de recherche');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      console.log('Envoi de la requête:', { query, client, erp, format, recentOnly, limit: parseInt(limit) });

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          client,
          erp,
          format,
          recentOnly,
          limit: parseInt(limit),
          raw,
        }),
      });

      console.log('Statut de la réponse:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse:', errorText);
        throw new Error(`Erreur: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données reçues:', data);

      // Traitement optimisé des données de l'API
      if (raw) {
        // Mode développeur: on attend des objets structurés
        if (Array.isArray(data.content)) {
          setResults(data.content);
        } else if (data.content) {
          setResults([data.content]);
        } else if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      } else {
        // Mode normal: on traite des chaînes de texte
        if (Array.isArray(data.content)) {
          // Contenu est déjà un tableau
          setResults(data.content);
        } else if (typeof data.content === 'string') {
          // Contenu est une chaîne unique
          setResults([data.content]);
        } else if (Array.isArray(data)) {
          // Réponse est directement un tableau
          setResults(data);
        } else if (data.content && typeof data.content === 'object') {
          // Contenu est un objet - conversion en chaîne JSON
          setResults([JSON.stringify(data.content)]);
        } else {
          setResults([]);
        }
      }

      setSources(data.sources || '');
      setMeta(data.meta || null);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error('Erreur complète:', err);
      setError(err.message);
      setResults([]);
      setSources('');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  const getFormatIcon = () => {
    switch (format) {
      case 'Summary':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'Detail':
        return <Database className="h-4 w-4 mr-2" />;
      case 'Guide':
        return <BookOpen className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 flex items-center justify-between rounded-b-lg border-b">
        <div className="flex items-center space-x-4">
          <Image
            src="/it_spirit_logo.jfif"
            alt="Logo ITSpirit"
            width={48}
            height={48}
            className="rounded-md"
            priority
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">IT SPIRIT</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              ITS Help
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-8">
        <Card className="search-form p-6 mb-8">
          <div className="grid gap-6">
            <div>
              <Label htmlFor="query" className="text-lg font-medium">Requête</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="query"
                  placeholder="Entrez votre requête..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base"
                />
                <Button onClick={handleSearch} disabled={isLoading} className="search-button">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Rechercher
                </Button>
              </div>
            </div>

            <div className="filter-section">
              <h3 className="text-md font-medium mb-3">Filtres</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 filter-grid">
                <div>
                  <Label htmlFor="client">Client (optionnel)</Label>
                  <Input
                    id="client"
                    placeholder="Nom du client..."
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="erp">ERP (optionnel)</Label>
                  <Select value={erp} onValueChange={setErp}>
                    <SelectTrigger id="erp">
                      <SelectValue placeholder="Sélectionner un ERP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les ERP</SelectItem>
                      <SelectItem value="SAP">SAP</SelectItem>
                      <SelectItem value="NetSuite">NetSuite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="limit">Nombre de résultats</Label>
                  <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger id="limit">
                      <SelectValue placeholder="Nombre de résultats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 résultats</SelectItem>
                      <SelectItem value="10">10 résultats</SelectItem>
                      <SelectItem value="20">20 résultats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <Label className="mb-2 block">Format de réponse</Label>
                  <RadioGroup value={format} onValueChange={setFormat} className="flex flex-wrap space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Summary" id="summary" />
                      <Label htmlFor="summary" className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Summary
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Detail" id="detail" />
                      <Label htmlFor="detail" className="flex items-center">
                        <Database className="h-4 w-4 mr-1" />
                        Detail
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Guide" id="guide" />
                      <Label htmlFor="guide" className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Guide
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recentOnly"
                    checked={recentOnly}
                    onCheckedChange={(checked) => setRecentOnly(checked as boolean)}
                  />
                  <Label htmlFor="recentOnly">Résultats récents uniquement (moins de 6 mois)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="raw"
                    checked={raw}
                    onCheckedChange={(checked) => setRaw(checked as boolean)}
                  />
                  <Label htmlFor="raw">Mode développeur (raw = true)</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {isLoading && (
          <Card className="mb-8">
            <LoaderMessage />
          </Card>
        )}

        {error && (
          <Card className="error-message p-4 mb-8">
            <p>{error}</p>
          </Card>
        )}

        {results.length === 0 && suggestions.length > 0 && (
          <Card className="suggestions-section p-4 mb-8">
            <h2 className="text-lg font-medium mb-2">Suggestions pour améliorer votre recherche</h2>
            <ul className="list-disc pl-5 space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </Card>
        )}

        {results.length > 0 && (
          <Card className="results-section p-4">
            <div className="results-header">
              <h2 className="results-count">Résultats ({results.length})</h2>
              {sources && (
                <p className="results-sources">
                  Sources: {sources}
                </p>
              )}
            </div>

            <div className="flex items-center mb-4">
              {getFormatIcon()}
              <span className="font-medium">Format: {format}</span>
            </div>

            {meta && <MetaBadge meta={meta} />}

            <ScrollArea className="h-[400px]">
  {format === 'Summary' && results.map((result, index) => (
  <SummaryCard
    key={index}
    content={result}
    format={format as 'Summary' | 'Guide'}
    isGpt={meta?.mode === 'deepresearch'}
  />
))}
  {format === 'Detail' && results.map((result, index) => (
    <DetailResultCard key={index} result={result} />
  ))}
  {format === 'Guide' && results.map((result, index) => (
    <GptResultCard key={index} content={result} />
  ))}
</ScrollArea>
          </Card>
        )}
      </div>
    </main>
  );
}
