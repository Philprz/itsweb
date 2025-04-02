# Configuration des Variables d'Environnement pour le Déploiement Next.js

## Problème identifié

Lors du déploiement de l'interface utilisateur Next.js sur Render, les erreurs suivantes ont été rencontrées :

```
Erreur lors de la recherche dans la collection NETSUITE: Error: Les variables d'environnement QDRANT_URL et QDRANT_API_KEY sont requises
```

Ces erreurs se répètent pour toutes les collections (NETSUITE, NETSUITE_DUMMIES, JIRA, CONFLUENCE, ZENDESK) et indiquent que les variables d'environnement nécessaires pour se connecter à Qdrant ne sont pas configurées dans le déploiement Render.

## Solution détaillée

### Option 1 : Configurer les variables d'environnement dans Render (Approche directe)

Cette option maintient l'approche actuelle où votre frontend Next.js communique directement avec Qdrant.

1. **Connectez-vous à votre tableau de bord Render**

2. **Sélectionnez votre service Next.js** dans la liste des services

3. **Accédez à l'onglet "Environment"**
   - Cliquez sur l'onglet "Environment" dans le menu de navigation du service

4. **Ajoutez les variables d'environnement suivantes** :
   ```
   QDRANT_URL=https://your-qdrant-instance.com
   QDRANT_API_KEY=your-qdrant-api-key
   QDRANT_COLLECTION_ZENDESK=ZENDESK
   QDRANT_COLLECTION_JIRA=JIRA
   QDRANT_COLLECTION_CONFLUENCE=CONFLUENCE
   QDRANT_COLLECTION_NETSUITE=NETSUITE
   QDRANT_COLLECTION_NETSUITE_DUMMIES=NETSUITE_DUMMIES
   QDRANT_COLLECTION_SAP=SAP
   ```
   
   Remplacez `https://your-qdrant-instance.com` et `your-qdrant-api-key` par vos informations réelles de connexion à Qdrant.
   
   Si vos collections ont des noms différents, ajustez les valeurs en conséquence.

5. **Cliquez sur "Save Changes"** pour enregistrer ces variables

6. **Redémarrez votre service**
   - Cliquez sur le bouton "Manual Deploy" puis "Deploy latest commit"
   - Ou cliquez sur "Restart Service" si cette option est disponible

### Option 2 : Modifier le frontend pour communiquer avec l'API Python (Approche recommandée)

Cette option est plus robuste car elle sépare clairement le frontend du backend, et vous n'avez pas besoin d'exposer vos informations d'accès Qdrant dans le frontend.

1. **Modifiez le fichier route.ts** comme indiqué dans notre document précédent :

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

// URL de l'API Python déployée sur Render
const API_URL = process.env.API_URL || 'https://itship.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Transmettre la requête à l'API Python
    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
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

2. **Configurez la variable d'environnement API_URL dans Render** :
   - Accédez à l'onglet "Environment" de votre service Next.js
   - Ajoutez la variable : `API_URL=https://itship.onrender.com` (remplacez par l'URL réelle de votre API Python)
   - Cliquez sur "Save Changes"

3. **Redéployez votre application** :
   - Cliquez sur "Manual Deploy" puis "Deploy latest commit"

## Comparaison des deux approches

### Option 1 : Configuration directe des variables Qdrant
- **Avantages** : Plus rapide à mettre en place si vous avez déjà les informations de connexion
- **Inconvénients** : Expose les informations d'accès Qdrant dans le frontend, moins sécurisé

### Option 2 : Communication via l'API Python
- **Avantages** : Plus sécurisé, meilleure séparation des préoccupations, plus facile à maintenir
- **Inconvénients** : Nécessite une modification du code et un redéploiement

## Vérification après déploiement

Après avoir appliqué l'une des solutions ci-dessus :

1. **Accédez à votre application déployée** via l'URL fournie par Render

2. **Testez la fonctionnalité de recherche** :
   - Entrez une requête dans le champ de recherche
   - Sélectionnez les filtres appropriés
   - Cliquez sur "Rechercher"

3. **Vérifiez les résultats** :
   - Si la recherche fonctionne, vous verrez les résultats affichés
   - Si des erreurs persistent, consultez les logs dans l'onglet "Logs" de votre service Render

## Recommandation

Nous recommandons l'**Option 2** (communication via l'API Python) pour les raisons suivantes :
- Meilleure architecture à long terme
- Plus sécurisée
- Plus facile à maintenir et à faire évoluer
- Évite d'exposer les informations d'accès Qdrant dans le frontend

Cependant, si vous avez besoin d'une solution rapide, l'Option 1 fonctionnera également.
