import { createSerializer, parseAsString } from 'nuqs/server';

// Importé par `paths.ts`, utilisé dans toute l'app : garder ce module sans
// dépendance lourde (serveur uniquement, nuqs). Pas d'import React/tRPC/client
// ici, sous peine de créer un cycle à large portée via `paths.ts`.
export const aiImportQueryState = { importJobId: parseAsString };
export const serializeAiImportQueryState = createSerializer(aiImportQueryState);
