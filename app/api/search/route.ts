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
    
    console.log(`Recherche dans ${collectionName} avec le filtre:`, JSON.stringify(searchFilter));
    
    // Exécution de la recherche
    const searchResult = await client.search(
      COLLECTIONS[collectionName as keyof typeof COLLECTIONS],
      {
        vector: queryVector,
        filter: searchFilter,
        limit: limit
      }
    );
    
    console.log(`Résultats de la recherche dans ${collectionName}:`, searchResult.length);
    
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
  try {
    console.log(`Envoi de la requête à l'API ${API_URL}:`, requestData);
    
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur de l'API (${response.status}):`, errorText);
      throw new Error(`Erreur de l'API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réponse de l\'API:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors du traitement via l\'API:', error);
    throw error;
  }
}

// Gestionnaire de la route API
export async function POST(request: NextRequest) {
  console.log('Réception d\'une requête POST');
  
  try {
    // Récupération des données de la requête
    const requestData = await request.json();
    console.log('Données reçues:', requestData);
    
    const { query, client = "", erp = "", format = "Summary", recentOnly = false, limit = 5 } = requestData;
    
    // Vérification de la présence de query
    if (!query) {
      console.error('Requête manquante');
      return NextResponse.json(
        { error: 'Requête de recherche requise' },
        { status: 400 }
      );
    }
    
    // Traitement de la requête
    const collections = getPrioritizedCollections(client, erp);
    console.log('Collections prioritaires:', collections);
    
    // Déterminer si la requête est ambiguë
    const isAmbiguous = isQueryAmbiguous(query, client, erp);
    
    // Si la requête est ambiguë, suggérer des modifications
    if (isAmbiguous) {
      console.log('Requête ambiguë détectée');
      return NextResponse.json({
        content: [],
        suggestions: [
          "Essayez d'ajouter plus de détails à votre requête",
          "Spécifiez un client ou un ERP pour des résultats plus pertinents",
          "Essayez d'utiliser des termes plus spécifiques"
        ]
      });
    }
    
    let content = [];
    let sources = '';
    
    // Si on utilise l'API Python
    if (USE_API) {
      console.log('Utilisation de l\'API Python');
      try {
        const apiResponse = await processWithAPI({
          query,
          client,
          erp,
          format,
          recentOnly,
          limit
        });
        
        return NextResponse.json(apiResponse);
      } catch (error) {
        console.error('Erreur avec l\'API Python:', error);
        // On continue avec la recherche locale en cas d'erreur API
      }
    }
    
    // Recherche locale dans Qdrant
    console.log('Recherche locale dans Qdrant');
    for (const collection of collections) {
      const results = await searchInCollection(
        collection,
        query,
        client,
        recentOnly,
        Math.ceil(limit / collections.length)
      );
      
      if (results.length > 0) {
        // Ajout des résultats au contenu
        content = content.concat(
          results.map(result => formatResponse(result, format))
        );
        
        // Ajout de la collection aux sources
        if (sources) {
          sources += ', ';
        }
        sources += collection;
        
        // Si on a suffisamment de résultats, on s'arrête
        if (content.length >= limit) {
          content = content.slice(0, limit);
          break;
        }
      }
    }
    
    console.log(`Nombre de résultats trouvés: ${content.length}`);
    
    // Si aucun résultat, suggérer des modifications
    if (content.length === 0) {
      console.log('Aucun résultat trouvé, envoi de suggestions');
      return NextResponse.json({
        content: [],
        suggestions: [
          "Essayez d'utiliser des mots-clés différents",
          "Vérifiez l'orthographe de votre requête",
          "Essayez une requête plus générale",
          "Si vous recherchez une information spécifique à un client, assurez-vous de spécifier son nom"
        ]
      });
    }
    
    // Retourner les résultats
    return NextResponse.json({
      content,
      sources
    });
  } catch (error: any) {
    console.error('Erreur lors du traitement de la requête:', error);
    return NextResponse.json(
      { error: `Erreur interne: ${error.message}` },
      { status: 500 }
    );
  }
}
