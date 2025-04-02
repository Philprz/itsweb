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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  const [query, setQuery] = useState('')
  const [client, setClient] = useState('')
  const [erp, setErp] = useState('')
  const [format, setFormat] = useState('Summary')
  const [recentOnly, setRecentOnly] = useState(true)
  const [limit, setLimit] = useState('5')
  const [results, setResults] = useState<any[]>([])
  const [sources, setSources] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
      
      // Vérifier la structure de la réponse et adapter le traitement
      if (Array.isArray(data.content)) {
        setResults(data.content);
      } else if (data.content) {
        setResults([data.content]);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
      
      setSources(data.sources || '');
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
  // Ajouter un nouvel état pour les suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);


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
      <header className="app-header">
        <h1 className="app-title">IT SPIRIT - Système d'Information Qdrant</h1>
        <p className="app-subtitle">Recherchez des informations sur les clients et les systèmes ERP (SAP et NetSuite)</p>
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
                  {isLoading ? (
                    <>
                      <Loader2 className="loading-spinner" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
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
              </div>
            </div>
          </div>
        </Card>
  
        {error && (
          <Card className="error-message mb-8">
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
          <Card className="results-section">
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
  
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {results.map((result, index) => (
                  <Card key={index} className="result-card p-4">
                    <div className="whitespace-pre-wrap">{result}</div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </main>
  );
}