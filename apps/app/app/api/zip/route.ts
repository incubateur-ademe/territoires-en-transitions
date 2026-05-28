import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import {
  isAllowedStorageUrl,
  sanitizeFilename,
  zipRequestSchema,
} from './validate';

// SÉCURITÉ (pentest V4 / ORHUS-302) :
// Cet endpoint génère une archive ZIP à partir d'URLs « signées Supabase
// Storage » fournies par le client. Avant correctif, il acceptait n'importe
// quelle URL et la téléchargeait via `fetch()`, exposant le serveur à une
// SSRF (Server-Side Request Forgery) : un attaquant non authentifié pouvait
// faire requêter des ressources internes (metadata cloud, APIs internes,
// RFC1918, etc.) et récupérer leur contenu via l'archive renvoyée.
//
// Le correctif applique la recommandation R7 du rapport :
//   1. Schéma Zod strict en entrée (forme + limites).
//   2. Whitelist : seules les URL préfixées par
//      `${SUPABASE_URL}/storage/v1/object/sign/` sont acceptées ; toute autre
//      origine ou tout autre chemin renvoient 400.
//   3. Filename ramené à un nom de fichier basique (anti zip slip).
//   4. Plafond sur le nombre d'éléments pour limiter l'abus en DoS.
//
// Limitation connue restant en suivi : aucune résolution DNS applicative
// (pas de protection explicite contre le DNS rebinding). À traiter si l'infra
// sortante ne filtre pas déjà les destinations privées.

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(
  /\/+$/,
  ''
);

async function fetchFileAsArrayBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for storage object`);
  }
  return await response.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = zipRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Arguments non valides' },
        { status: 400 }
      );
    }

    // Valide chaque URL contre la whitelist + sanitize les noms de fichiers.
    const sanitized: { filename: string; url: string }[] = [];
    for (const entry of parsed.data.signedUrls) {
      if (!isAllowedStorageUrl(entry.url, SUPABASE_URL)) {
        return NextResponse.json(
          { error: 'URL non autorisée' },
          { status: 400 }
        );
      }
      const safeName = sanitizeFilename(entry.filename);
      if (!safeName) {
        return NextResponse.json(
          { error: 'Nom de fichier invalide' },
          { status: 400 }
        );
      }
      sanitized.push({ filename: safeName, url: entry.url });
    }

    const zip = new JSZip();

    await Promise.all(
      sanitized.map(async ({ filename, url }) => {
        const fileData = await fetchFileAsArrayBuffer(url);
        zip.file(filename, fileData);
      })
    );

    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      streamFiles: true,
    });

    const stream = Readable.from(zipContent);
    const contentLength = zipContent.length;

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="download.zip"`,
        'Content-Length': contentLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}
