# Solution Finale pour le Déploiement de l'Interface Qdrant

## Problèmes identifiés

Après avoir testé le site déployé à l'URL https://itsweb.onrender.com/, j'ai identifié les problèmes suivants :

1. **Erreur de variables d'environnement** : Les logs montrent que les variables QDRANT_URL et QDRANT_API_KEY ne sont pas définies.

2. **Erreur de parsing JSON** : Lorsqu'on effectue une recherche, l'erreur "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" apparaît, indiquant que l'API renvoie une page HTML d'erreur au lieu de JSON.

3. **Problème de communication** : Le frontend Next.js tente de communiquer directement avec Qdrant, mais les informations de connexion ne sont pas configurées correctement.

## Solution complète

### 1. Modification du fichier route.ts

Le problème principal est que le frontend tente d'accéder directement à Qdrant, mais les variables d'environnement ne sont pas configurées. La meilleure solution est de modifier le fichier route.ts pour qu'il communique avec l'API Python déjà déployée.

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

// URL de l'API Python déployée sur Render
const API_URL = process.env.API_URL || 'https://itship.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    console.log('Envoi de la requête à l'API Python:', requestData);
    
    // Transmettre la requête à l'API Python
    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      console.error('Erreur API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Détails de l'erreur:', errorText);
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Réponse de l'API Python:', data);
    
    // Retourner la réponse de l'API Python
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erreur lors du traitement de la requête:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors du traitement de la requête' },
      { status: 500 }
    );
  }
}
```

### 2. Configuration des variables d'environnement dans Render

1. Accédez au tableau de bord Render pour votre service Next.js
2. Allez dans l'onglet "Environment"
3. Ajoutez la variable d'environnement suivante :
   ```
   API_URL=https://itship.onrender.com
   ```
   (Remplacez par l'URL réelle de votre API Python)
4. Cliquez sur "Save Changes"
5. Redéployez votre application

### 3. Vérification de l'API Python

Assurez-vous que votre API Python (https://itship.onrender.com) est correctement configurée :

1. Vérifiez que les variables d'environnement sont configurées dans le service Python :
   ```
   QDRANT_URL=https://your-qdrant-instance.com
   QDRANT_API_KEY=your-qdrant-api-key
   ```

2. Testez directement l'API Python avec une requête curl :
   ```bash
   curl -X POST https://itship.onrender.com/api/search \
     -H "Content-Type: application/json" \
     -d '{"query":"rondot", "erp":"SAP", "format":"Summary", "recentOnly":true, "limit":5}'
   ```

### 4. Modification du fichier next.config.js

Pour faciliter la communication entre le frontend et l'API Python, ajoutez une configuration de proxy dans next.config.js :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'https://itship.onrender.com'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5. Ajout de logs de débogage dans le frontend

Pour faciliter le débogage, ajoutez des logs dans le fichier page.tsx :

```typescript
// Dans la fonction handleSearch
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

    setResults(data.content || []);
    setSources(data.sources || '');
  } catch (err: any) {
    console.error('Erreur complète:', err);
    setError(err.message);
    setResults([]);
    setSources('');
  } finally {
    setIsLoading(false);
  }
};
```

## Étapes de déploiement

1. **Modifiez les fichiers** comme indiqué ci-dessus :
   - route.ts
   - next.config.js
   - page.tsx (ajout des logs)

2. **Poussez les modifications** vers votre dépôt Git

3. **Configurez les variables d'environnement** dans Render :
   - API_URL=https://itship.onrender.com

4. **Redéployez l'application** sur Render :
   - Cliquez sur "Manual Deploy" puis "Deploy latest commit"

5. **Vérifiez les logs** après le déploiement pour identifier d'éventuelles erreurs

## Vérification après déploiement

1. Accédez à votre application déployée via l'URL fournie par Render
2. Ouvrez les outils de développement du navigateur (F12) et allez dans l'onglet "Console"
3. Effectuez une recherche et observez les logs pour identifier d'éventuels problèmes
4. Vérifiez que les résultats s'affichent correctement

## Conclusion

Cette solution résout les problèmes identifiés en :
1. Redirigeant les requêtes du frontend vers l'API Python au lieu d'accéder directement à Qdrant
2. Configurant correctement les variables d'environnement
3. Ajoutant des logs de débogage pour faciliter l'identification des problèmes
4. Utilisant un proxy pour simplifier la communication entre le frontend et l'API

Cette approche est plus robuste et sécurisée, car elle évite d'exposer les informations d'accès Qdrant dans le frontend.
