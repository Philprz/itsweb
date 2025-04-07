#!/bin/bash
# Script d'installation des dépendances pour IT SPIRIT

echo "Installation des dépendances pour IT SPIRIT..."

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "npm n'est pas installé. Veuillez installer Node.js et npm d'abord."
    exit 1
fi

# Installer les dépendances
echo "Installation des packages nécessaires..."
npm install openai@^4.0.0 @qdrant/js-client-rest@^1.6.0

# Vérifier si .env.local existe, sinon le créer
if [ ! -f .env.local ]; then
    echo "Création du fichier .env.local..."
    touch .env.local
    
    # Ajouter les variables d'environnement par défaut
    echo "API_URL=https://itshlp.onrender.com" >> .env.local
    echo "QDRANT_URL=https://b361537d-20a3-4a84-b96f-9efb19837c15.us-east4-0.gcp.cloud.qdrant.io:6333" >> .env.local
    echo "QDRANT_API_KEY=F8-4TSvSJt-M_3pAAJY_6OIM5xTdN8kvvV0USQLXuo1LLUHgM3yPBQ" >> .env.local
    echo "USE_API=true" >> .env.local
    echo "# OPENAI_API_KEY=sk-..." >> .env.local
    echo
    echo "⚠️ Fichier .env.local créé avec des paramètres par défaut."
    echo "⚠️ Veuillez mettre à jour la clé API OpenAI dans .env.local"
else
    echo ".env.local existe déjà."
fi

echo
echo "✅ Installation terminée."
echo "N'oubliez pas de configurer votre clé API OpenAI dans le fichier .env.local"
echo "Puis redémarrez le serveur avec: npm run dev"