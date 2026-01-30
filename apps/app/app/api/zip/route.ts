import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

async function fetchFileAsStream(url: string): Promise<ReadableStream> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.body;
}

function webStreamToNodeStream(webStream: ReadableStream): Readable {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });
}

function nodeStreamToWebStream(
  nodeStream: NodeJS.ReadableStream
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream
        .on('data', (chunk: Buffer | Uint8Array) => {
          // Envoie les chunks au ReadableStream web
          controller.enqueue(
            chunk instanceof Buffer ? new Uint8Array(chunk) : chunk
          );
        })
        .on('end', () => {
          controller.close();
        })
        .on('error', (err: Error) => {
          controller.error(err);
        });
    },
    cancel() {
      if ('destroy' in nodeStream && typeof nodeStream.destroy === 'function') {
        nodeStream.destroy();
      }
    },
  });
}

const ZIP_STREAM_RESPONSE_HEADERS = {
  'Content-Type': 'application/zip',
  'Content-Disposition': `attachment; filename="download.zip"`,
  // Pas de Content-Length car on stream à la volée
  'Transfer-Encoding': 'chunked',
  // Disable Next.js response caching
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: Request) {
  try {
    const { signedUrls } = await request.json();

    const zip = new JSZip();

    // Ajoute les fichiers au ZIP de manière séquentielle pour éviter de surcharger la mémoire
    // On télécharge par lots de 5 pour équilibrer performance et consommation mémoire
    const BATCH_SIZE = 5;
    for (let i = 0; i < signedUrls.length; i += BATCH_SIZE) {
      const batch = signedUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(
          async ({ filename, url }: { filename: string; url: string }) => {
            try {
              // Télécharge le fichier en stream
              const webStream = await fetchFileAsStream(url);
              const nodeStream = webStreamToNodeStream(webStream);

              // Ajoute le stream au ZIP
              zip.file(filename, nodeStream);
            } catch (error) {
              console.error(`Error fetching file ${filename}:`, error);
              // Continue avec les autres fichiers même si un échoue
            }
          }
        )
      );
    }

    // Génère le ZIP en streaming pour éviter de charger tout en mémoire
    const zipNodeStream = zip
      .generateNodeStream({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        streamFiles: true,
        compressionOptions: { level: 6 }, // Niveau de compression modéré
      })
      .on('error', (error) => {
        console.error('Error generating ZIP stream:', error);
      });

    const zipWebStream = nodeStreamToWebStream(zipNodeStream);

    return new NextResponse(zipWebStream, {
      headers: ZIP_STREAM_RESPONSE_HEADERS,
    });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}
