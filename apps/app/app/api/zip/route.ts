import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Readable } from 'stream';

async function fetchFileAsArrayBuffer(url: string) {
  const response = await fetch(url);
  return await response.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    const { signedUrls } = await request.json();

    const zip = new JSZip();

    // Download all files and add them to the ZIP
    await Promise.all(
      signedUrls.map(
        async ({ filename, url }: { filename: string; url: string }) => {
          const fileData = await fetchFileAsArrayBuffer(url);
          zip.file(filename, fileData);
        }
      )
    );

    // Generate ZIP content
    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      streamFiles: true,
    });

    // Create a readable stream from the ZIP content
    const stream = Readable.from(zipContent);

    // Get the total size for the Content-Length header
    const contentLength = zipContent.length;

    // Return streaming response
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="download.zip"`,
        'Content-Length': contentLength.toString(),
        // Disable Next.js response caching
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
