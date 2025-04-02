import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { DateTime } from 'luxon';

// Configuration Qdrant
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTIONS = {
  "ZENDESK": process.env.QDRANT_COLLECTION_ZENDESK || "ZENDESK",
  "JIRA": process.env.QDRANT_COLLECTION_JIRA || "JIRA",
  "CONFLUENCE": process.env.QDRANT_COLLECTION_CONFLUENCE || "CONFLUENCE",
  "NETSUITE": process.env.QDRANT_COLLECTION_NETSUITE || "NETSUITE",
  "NETSUITE_DUMMIES": process.env.QDRANT_COLLECTION_NETSUITE_DUMMIES || "NETSUITE_DUMMIES",
  "SAP": process.env.QDRANT_COLLECTION_SAP || "SAP"
};

// URL de l'API Python déployée sur Render
const API_URL = process.env.API_URL || 'https://itshlp.onrender.com';

// Mode de fonctionnement (local ou API)
const USE_API = process.env.USE_API === 'true' || false;

// Client Qdrant
let qdrantClient: QdrantClient | null = null;

// Fonction pour obtenir le client Qdrant
function getQdrantClient() {
  if (!qdrantClient) {
    if (!QDRANT_URL || !QDRANT_API_KEY) {
      throw new Error('Les variables d\'environnement QDRANT_URL et QDRANT_API_KEY sont requises');
    }
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
  }
  return qdrantClient;
}

// Fonction pour obtenir les collections prioritaires
function getPrioritizedCollections(clientName: string = "", erp: string = ""): string[] {
  // Si on a un client, on priorise JIRA, CONFLUENCE, ZENDESK
  if (clientName) {
    if (erp === "SAP") {
      return ["JIRA", "CONFLUENCE", "ZENDESK", "SAP"];
    } else if (erp === "NetSuite") {
      return ["JIRA", "CONFLUENCE", "ZENDESK", "NETSUITE", "NETSUITE_DUMMIES"];
    } else {
      // Si on ne connaît pas l'ERP, on renvoie toutes les collections
      return ["JIRA", "CONFLUENCE", "ZENDESK", "SAP", "NETSUITE", "NETSUITE_DUMMIES"];
    }
  }
  
  // Si on a un ERP mais pas de client
  if (erp === "SAP") {
    return ["SAP", "JIRA", "CONFLUENCE", "ZENDESK"];
  } else if (erp === "NetSuite") {
    return ["NETSUITE", "NETSUITE_DUMMIES", "JIRA", "CONFLUENCE", "ZENDESK"];
  }
  
  // Si on n'a ni client ni ERP, on renvoie toutes les collections
  return ["JIRA", "CONFLUENCE", "ZENDESK", "SAP", "NETSUITE", "NETSUITE_DUMMIES"];
}

// Fonction pour rechercher dans une collection
async function searchInCollection(
  collectionName: string,
  query: string,
  clientName: string = "",
  recentOnly: boolean = false,
  limit: number = 5
) {
  try {
    const client = getQdrantClient();
    
    // Préparation des filtres
    const filterConditions: any[] = [];
    
    // Filtre par client si spécifié
    if (clientName) {
      filterConditions.push({
        key: "client",
        match: {
          value: clientName
        }
      });
    }
    
    // Filtre par date si recent_only est True
    if (recentOnly) {
      const sixMonthsAgo = DateTime.now().minus({ months: 6 }).toISODate();
      filterConditions.push({
        key: "created",
        range: {
          gte: sixMonthsAgo
        }
      });
    }
    
    // Construction du filtre final
    let searchFilter = null;
    if (filterConditions.length > 0) {
      searchFilter = {
        must: filterConditions
      };
    }
    
    // Simulation de vecteur d'embedding pour la requête
    // Dans une implémentation réelle, nous utiliserions un modèle d'embedding
    const queryVector = Array(1536).fill(0).map(() => Math.random());
    
    // Exécution de la recherche
    const searchResult = await client.search(
      COLLECTIONS[collectionName as keyof typeof COLLECTIONS],
      {
        vector: queryVector,
        filter: searchFilter,
        limit: limit
      }
    );
    
    // Conversion des résultats
    return searchResult.map(result => result.payload);
  } catch (error) {
    console.error(`Erreur lors de la recherche dans la collection ${collectionName}:`, error);
    return [];
  }
}

// Fonction pour formater la réponse
function formatResponse(content: any, formatType: string = "Summary"): string {
  if (!["Summary", "Detail", "Guide"].includes(formatType)) {
    formatType = "Summary";
  }
  
  // Formatage selon le type demandé
  if (formatType === "Summary") {
    // Résumé bref
    return formatSummary(content);
  } else if (formatType === "Detail") {
    // Explication complète
    return formatDetail(content);
  } else if (formatType === "Guide") {
    // Instructions étape par étape
    return formatGuide(content);
  }
  
  return "";
}

// Fonction pour formater en résumé
function formatSummary(content: any): string {
  // Implémentation du formatage en résumé
  let summary = content.summary || "";
  if (!summary && content.content) {
    // Si pas de résumé mais du contenu, on prend les 200 premiers caractères
    summary = content.content.length > 200 
      ? content.content.substring(0, 200) + "..." 
      : content.content;
  }
  
  return summary;
}

// Fonction pour formater en détail
function formatDetail(content: any): string {
  // Implémentation du formatage en détail
  let detail = "";
  
  // Titre ou résumé
  if (content.title) {
    detail += `## ${content.title}\n\n`;
  } else if (content.summary) {
    detail += `## ${content.summary}\n\n`;
  }
  
  // Contenu principal
  if (content.content) {
    detail += `${content.content}\n\n`;
  } else if (content.description) {
    detail += `${content.description}\n\n`;
  } else if (content.text) {
    detail += `${content.text}\n\n`;
  }
  
  // Informations supplémentaires
  if (content.comments) {
    detail += `### Commentaires\n${content.comments}\n\n`;
  }
  
  // Métadonnées
  const metadata = [];
  if (content.created) {
    metadata.push(`Créé le: ${content.created}`);
  }
  if (content.updated) {
    metadata.push(`Mis à jour le: ${content.updated}`);
  }
  if (content.assignee) {
    metadata.push(`Assigné à: ${content.assignee}`);
  }
  
  if (metadata.length > 0) {
    detail += "---\n" + metadata.join("\n");
  }
  
  return detail;
}

// Fonction pour formater en guide
function formatGuide(content: any): string {
  // Implémentation du formatage en guide
  let guide = "";
  
  // Titre ou résumé
  if (content.title) {
    guide += `# ${content.title}\n\n`;
  } else if (content.summary) {
    guide += `# ${content.summary}\n\n`;
  }
  
  // Description ou introduction
  if (content.description) {
    guide += `${content.description}\n\n`;
  } else if (content.content && content.content.length < 500) {
    guide += `${content.content}\n\n`;
  }
  
  // Extraction des étapes si contenu disponible
  if (content.content && content.content.length > 500) {
    const steps = extractSteps(content.content);
    
    if (steps.length > 0) {
      guide += "## Étapes à suivre\n\n";
      steps.forEach((step, index) => {
        guide += `${index + 1}. ${step}\n\n`;
      });
    } else {
      // Si pas d'étapes claires, on met le contenu en format détaillé
      guide += `${content.content}\n\n`;
    }
  }
  
  // Informations complémentaires
  if (content.notes) {
    guide += `## Notes importantes\n${content.notes}\n\n`;
  }
  
  // Source ou référence
  if (content.source) {
    guide += `---\nSource: ${content.source}\n`;
  }
  
  return guide;
}

// Fonction pour extraire les étapes d'un texte
function extractSteps(text: string): string[] {
  const steps: string[] = [];
  
  // Tentative d'extraction avec numéros (1. 2. 3. etc.)
  const numberedRegex = /\n\s*(\d+)[\.\)]\s*(.*?)(?=\n\s*\d+[\.\)]|$)/g;
  let numberedMatch;
  
  while ((numberedMatch = numberedRegex.exec(text)) !== null) {
    steps.push(numberedMatch[2].trim());
  }
  
  // Si on a trouvé des étapes numérotées, on les renvoie
  if (steps.length > 0) {
    return steps;
  }
  
  // Tentative d'extraction avec puces (• - *)
  const bulletRegex = /\n\s*[•\-\*]\s*(.*?)(?=\n\s*[•\-\*]|$)/g;
  let bulletMatch;
  
  while ((bulletMatch = bulletRegex.exec(text)) !== null) {
    steps.push(bulletMatch[1].trim());
  }
  
  // Si on a trouvé des étapes à puces, on les renvoie
  if (steps.length > 0) {
    return steps;
  }
  
  // Tentative d'extraction de paragraphes courts
  const paragraphs: string[] = [];
  const lines = text.split('\n');
  let currentPara = "";
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === "") {
      if (currentPara) {
        paragraphs.push(currentPara.trim());
        currentPara = "";
      }
    } else {
      currentPara += " " + trimmedLine;
    }
  }
  
  if (currentPara) {
    paragraphs.push(currentPara.trim());
  }
  
  // Si on a entre 3 et 10 paragraphes, on les considère comme des étapes
  if (paragraphs.length >= 3 && paragraphs.length <= 10) {
    return paragraphs;
  }
  
  return steps;
}

// Fonction pour vérifier si une requête est ambiguë
function isQueryAmbiguous(query: string, clientName: string, erp: string): boolean {
  // Si on n'a pas de client ni d'ERP et que la requête ne les mentionne pas
  if (!clientName && !erp) {
    // Vérifier si la requête mentionne un ERP
    const erpMentioned = query.includes("SAP") || query.includes("NetSuite");
    
    if (!erpMentioned) {
      return true;
    }
  }
  
  return false;
}

// Fonction pour traiter la requête via l'API Python
async function processWithAPI(requestData: any) {
  console.log('Envoi de la requête à l\'API Python:', requestData);
  
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
    console.error('Détails de l\'erreur:', errorText);
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Réponse de l\'API Python:', data);
  
  return data;
}

// Gestionnaire de la route API
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Si mode API est activé, on délègue tout à l'API Python
    if (USE_API) {
      const data = await processWithAPI(requestData);
      return NextResponse.json(data);
    }
    
    // Sinon, on utilise le traitement local avec Qdrant
    const { query, client, erp, format, recentOnly, limit } = requestData;

    // Vérification des paramètres requis
    if (!query) {
      return NextResponse.json(
        { error: 'Le paramètre query est requis' },
        { status: 400 }
      );
    }

    // Vérification si la requête est ambiguë
    if (isQueryAmbiguous(query, client, erp)) {
      return NextResponse.json({
        format: "Clarification",
        content: ["Votre requête est ambiguë. Pourriez-vous préciser pour quel ERP (SAP ou NetSuite) vous souhaitez des informations ?"],
        sources: ""
      });
    }

    // Récupération des collections prioritaires
    const prioritizedCollections = getPrioritizedCollections(client, erp);

    // Recherche dans chaque collection
    const allResults = [];
    const collectionsUsed = [];

    for (const collectionName of prioritizedCollections) {
      const results = await searchInCollection(
        collectionName,
        query,
        client,
        recentOnly,
        limit
      );

      if (results.length > 0) {
        allResults.push(...results);
        collectionsUsed.push(collectionName);

        // Si on a suffisamment de résultats, on s'arrête
        if (allResults.length >= limit) {
          break;
        }
      }
    }

    // Formatage des résultats
    const formattedResults = allResults
      .slice(0, limit)
      .map(result => formatResponse(result, format));

    // Création de la réponse finale
    return NextResponse.json({
      format,
      content: formattedResults,
      sources: collectionsUsed.join(", ")
    });
  } catch (error: any) {
    console.error('Erreur lors du traitement de la requête:', error);
    return NextResponse.json(
      {
        error: error.message || 'Une erreur est survenue lors du traitement de la requête',
        suggestions: [
          "Vérifiez votre connexion internet",
          "Essayez de rafraîchir la page",
          "Réessayez dans quelques instants"
        ]
      },
      { status: 500 }
    );
  }
}
