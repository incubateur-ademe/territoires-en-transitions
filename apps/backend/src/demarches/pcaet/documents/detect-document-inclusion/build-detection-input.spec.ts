import {
  buildDocument,
  buildPage,
} from '@tet/backend/plans/ai-plan-import/pipeline/document/document-page';
import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { describe, expect, it } from 'vitest';
import {
  buildDetectionInput,
  keepDocumentPages,
  MAX_DETECTION_INPUT_TOKENS,
} from './build-detection-input';
import {
  INCLUSION_DETECTION_PROMPTS,
  PLCF_DOCUMENT_ID,
} from './detect-document-inclusion.prompts';

const { keywords } = INCLUSION_DETECTION_PROMPTS[PLCF_DOCUMENT_ID];
const NONCE = 'nonce-de-test';

const document = (pages: string[][]) =>
  buildDocument(
    'pdf',
    pages.map((lines, index) =>
      buildPage(
        index,
        lines.map((text) => ({ text }))
      )
    )
  );

describe('buildDetectionInput', () => {
  it('ne prépare rien pour un document qui ne nomme jamais le sujet', () => {
    expect(
      buildDetectionInput(
        document([
          ['Diagnostic', 'Émissions de gaz à effet de serre du territoire.'],
          ['Qualité de l’air', 'Les particules fines proviennent du trafic.'],
        ]),
        keywords,
        NONCE
      )
    ).toBeNull();
  });

  it.each([
    'Le plan local de chaleur et de froid du territoire',
    'Développer les réseaux de chaleur urbains',
    'Le PLCF est intégré au présent diagnostic',
    'Part de la chaleur renouvelable dans la consommation',
  ])('repère « %s »', (phrase) => {
    expect(
      buildDetectionInput(document([[phrase]]), keywords, NONCE)
    ).not.toBeNull();
  });

  it('ne garde que les pages qui parlent du sujet, balisées par le nonce', () => {
    const input = buildDetectionInput(
      document([
        ['Mobilité', 'Le covoiturage progresse.'],
        ['Énergie', 'Trois réseaux de chaleur desservent la ville-centre.'],
      ]),
      keywords,
      NONCE
    );

    expect(input?.excerpts).toContain(`<page numero="2" nonce="${NONCE}">`);
    expect(input?.excerpts).toContain('Trois réseaux de chaleur');
    expect(input?.excerpts).not.toContain('covoiturage');
    expect(input?.matchCount).toBe(1);
  });

  it('reste sous le budget de tokens, même sur un long document', () => {
    const longue = Array.from(
      { length: 400 },
      (_, index) =>
        `Ligne ${index} : le réseau de chaleur et de froid alimente le quartier ${index}.`
    );
    const input = buildDetectionInput(
      document(Array.from({ length: 30 }, () => longue)),
      keywords,
      NONCE
    );

    expect(input).not.toBeNull();
    expect(
      estimateTokenCount(`${input?.outline}\n${input?.excerpts}`)
    ).toBeLessThanOrEqual(MAX_DETECTION_INPUT_TOKENS);
  });
});

describe('keepDocumentPages', () => {
  const troisPages = document([['Un'], ['Deux'], ['Trois']]);

  it('ne garde que les pages du document, dans son ordre et sans doublon', () => {
    expect(
      keepDocumentPages(troisPages, ['3', ' 1 ', '3', '12', 'p. 2'])
    ).toEqual(['1', '3']);
  });

  it('reconnaît les onglets d’un tableur par leur nom', () => {
    const classeur = buildDocument('xlsx', [
      buildPage(0, [{ text: 'Actions' }], { label: 'Programme' }),
      buildPage(1, [{ text: 'Réseaux' }], { label: 'PLCF' }),
    ]);
    expect(keepDocumentPages(classeur, ['PLCF', '1'])).toEqual(['PLCF']);
  });
});
