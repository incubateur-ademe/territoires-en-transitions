import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

type PageComparisonResult = {
  page: number;
  totalPixels: number;
  diffPixels: number;
  diffPercent: number;
  diffImagePath: string | null;
};

export type ComparisonResult = {
  pages: PageComparisonResult[];
  maxDiffPercent: number;
  passed: boolean;
};

async function pdfToImages(pdfPath: string): Promise<Buffer[]> {
  const { pdf } = await import('pdf-to-img');
  const images: Buffer[] = [];

  for await (const image of await pdf(pdfPath, { scale: 2.0 })) {
    images.push(Buffer.from(image));
  }

  return images;
}

export async function comparePdfs({
  baselinePath,
  candidatePath,
  outputDir,
  threshold,
  maxDiffPercent,
}: {
  baselinePath: string;
  candidatePath: string;
  outputDir: string;
  threshold: number;
  maxDiffPercent: number;
}): Promise<ComparisonResult> {
  mkdirSync(outputDir, { recursive: true });

  const baselineImages = await pdfToImages(baselinePath);
  const candidateImages = await pdfToImages(candidatePath);

  const pageCount = Math.max(baselineImages.length, candidateImages.length);
  const pages: PageComparisonResult[] = [];

  for (let i = 0; i < pageCount; i++) {
    const baselineImg = baselineImages[i];
    const candidateImg = candidateImages[i];

    if (!baselineImg || !candidateImg) {
      pages.push({
        page: i + 1,
        totalPixels: 0,
        diffPixels: -1,
        diffPercent: 100,
        diffImagePath: null,
      });
      continue;
    }

    const baselinePng = PNG.sync.read(baselineImg);
    const candidatePng = PNG.sync.read(candidateImg);

    const width = Math.min(baselinePng.width, candidatePng.width);
    const height = Math.min(baselinePng.height, candidatePng.height);
    const diffPng = new PNG({ width, height });

    const diffPixels = pixelmatch(
      baselinePng.data,
      candidatePng.data,
      diffPng.data,
      width,
      height,
      { threshold }
    );

    const totalPixels = width * height;
    const diffPercent = (diffPixels / totalPixels) * 100;

    const diffImagePath = path.join(outputDir, `diff-page-${i + 1}.png`);
    writeFileSync(diffImagePath, PNG.sync.write(diffPng));

    const baselinePngPath = path.join(outputDir, `baseline-page-${i + 1}.png`);
    writeFileSync(baselinePngPath, baselineImg);

    const candidatePngPath = path.join(outputDir, `candidate-page-${i + 1}.png`);
    writeFileSync(candidatePngPath, candidateImg);

    pages.push({
      page: i + 1,
      totalPixels,
      diffPixels,
      diffPercent,
      diffImagePath,
    });
  }

  const actualMaxDiff = Math.max(...pages.map((p) => p.diffPercent));

  return {
    pages,
    maxDiffPercent: actualMaxDiff,
    passed: actualMaxDiff <= maxDiffPercent,
  };
}
