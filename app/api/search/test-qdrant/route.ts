// app/api/test-qdrant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

export async function GET() {
  try {
    const QDRANT_URL = process.env.QDRANT_URL;
    const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
    
    if (!QDRANT_URL || !QDRANT_API_KEY) {
      return NextResponse.json(
        { 
          connected: false, 
          error: 'Variables d\'environnement QDRANT_URL ou QDRANT_API_KEY non définies' 
        }
      );
    }
    
    const client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
    
    // Tester la connexion en listant les collections
    const collections = await client.getCollections();
    
    return NextResponse.json({
      connected: true,
      collections: collections.collections.map(collection => collection.name)
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        connected: false, 
        error: `Erreur de connexion à Qdrant: ${error.message}` 
      }
    );
  }
}