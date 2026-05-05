import { renderToBuffer } from '@react-pdf/renderer';
import { Text, View } from '@react-pdf/renderer';
import { describe, it, expect, beforeAll } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { registerMarianneForNode } from '../fonts/register-node';
import DocumentToExport from '../primitives/DocumentToExport';
import type { ImageSources } from '../primitives/DocumentToExport';
import FicheActionPdf from '../fiche-action/FicheActionPdf';
import { ficheActionFixture } from './__fixtures__/fiche-81152.fixture';
import { comparePdfs } from './pdf-visual-compare';

const ASSETS_DIR = path.resolve(__dirname, '../../assets');
const OUTPUT_DIR = path.resolve(__dirname, '__output__');

const nodeImageSources: ImageSources = {
  repFrancaiseLogo: path.join(ASSETS_DIR, 'images/repFrancaiseLogo.png'),
  ademeLogo: path.join(ASSETS_DIR, 'images/ademeLogo.png'),
};

beforeAll(() => {
  registerMarianneForNode();
  mkdirSync(OUTPUT_DIR, { recursive: true });
});

describe('PDF Node rendering', () => {
  it('renders a minimal PDF with Marianne font family', async () => {
    const element = (
      <DocumentToExport
        imageSources={nodeImageSources}
        content={
          <View>
            <Text style={{ fontFamily: 'Marianne', fontSize: 24, fontWeight: 700 }}>
              Test Fiche Action
            </Text>
            <Text style={{ fontFamily: 'Marianne', fontSize: 12 }}>
              Ceci est un test de rendu PDF avec la police Marianne.
            </Text>
            <Text style={{ fontFamily: 'Marianne', fontSize: 12, fontStyle: 'italic' }}>
              Accents : e, e, c, a, u, o
            </Text>
          </View>
        }
      />
    );

    const buffer = await renderToBuffer(element);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    const pdfHeader = buffer.subarray(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');

    const outputPath = path.join(OUTPUT_DIR, 'minimal-test.pdf');
    writeFileSync(outputPath, buffer);
  }, 30_000);

  it('renders fiche-81152 with full fixture data', async () => {
    const element = (
      <DocumentToExport
        imageSources={nodeImageSources}
        content={<FicheActionPdf {...ficheActionFixture} />}
      />
    );

    const buffer = await renderToBuffer(element);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);

    const pdfHeader = buffer.subarray(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');

    const outputPath = path.join(OUTPUT_DIR, 'fiche-81152-server.pdf');
    writeFileSync(outputPath, buffer);
  }, 60_000);

  it('visual regression: server PDF matches golden baseline structure', async () => {
    const goldenPath = path.join(__dirname, '__fixtures__/golden-baseline-fiche-81152.pdf');
    const candidatePath = path.join(OUTPUT_DIR, 'fiche-81152-server.pdf');

    const result = await comparePdfs({
      baselinePath: goldenPath,
      candidatePath: candidatePath,
      outputDir: path.join(OUTPUT_DIR, 'visual-diff'),
      threshold: 0.3,
      maxDiffPercent: 15,
    });

    console.log('Visual regression results:');
    for (const page of result.pages) {
      console.log(
        `  Page ${page.page}: ${page.diffPixels} diff pixels (${page.diffPercent.toFixed(2)}%)`
      );
    }
    console.log(`  Max diff: ${result.maxDiffPercent.toFixed(2)}%`);
    console.log(`  Passed: ${result.passed}`);

    expect(result.pages.length).toBeGreaterThan(0);

    for (const page of result.pages) {
      expect(page.diffPercent).toBeLessThan(15);
    }
  }, 120_000);
});
