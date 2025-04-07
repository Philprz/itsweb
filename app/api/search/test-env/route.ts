// app/api/test-env/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { varName } = data;
    
    if (!varName) {
      return NextResponse.json(
        { error: 'Le nom de la variable est requis' },
        { status: 400 }
      );
    }
    
    const value = process.env[varName];
    const isDefined = !!value;
    
    // Ne pas renvoyer la valeur réelle pour des raisons de sécurité
    return NextResponse.json({ defined: isDefined });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erreur: ${error.message}` },
      { status: 500 }
    );
  }
}
