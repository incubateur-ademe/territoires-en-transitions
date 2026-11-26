import { describe, expect, it } from 'vitest';
import {
  type AnalysisAbandonedError,
  modelDoubtMotifValues,
} from '../models/model-doubt';
import { ImportGenerationErrors } from './generate-import.errors';

const abandon = (
  overrides: Partial<AnalysisAbandonedError> = {}
): AnalysisAbandonedError => ({
  kind: 'analysis_abandoned',
  motif: 'texte-illisible',
  evidence: [
    { citation: 'Plan climat', page: 2 },
    { citation: 'Axe 1 Mobilités', page: 5 },
  ],
  explanation: '',
  ...overrides,
});

describe('ImportGenerationErrors.abandoned', () => {
  it('dit le problème, les pages illisibles, les passages relevés et quoi faire', () => {
    expect(
      ImportGenerationErrors.abandoned(
        abandon({ readingStats: { pageCount: 8, unreadablePages: 3 } })
      ).split('\n')
    ).toEqual([
      "L'IA ne parvient pas à lire assez de texte dans ce document et préfère s'arrêter plutôt que de deviner. 3 pages sur 8 n'ont pas de texte exploitable.",
      "Ce qu'elle a relevé : « Plan climat » (p. 2), « Axe 1 Mobilités » (p. 5).",
      "Déposez une version dont le texte se sélectionne (un PDF exporté depuis le traitement de texte plutôt qu'un scan) ou, à défaut, contactez-nous.",
    ]);
  });

  it.each(modelDoubtMotifValues)(
    'donne la parole au modèle et un conseil pour « %s »',
    (motif) => {
      const lines = ImportGenerationErrors.abandoned(
        abandon({ motif, explanation: 'Deux plans dans un fichier.' })
      ).split('\n');

      expect(lines).toHaveLength(4);
      expect(lines[2]).toBe('Elle précise : « Deux plans dans un fichier. »');
    }
  );

  it('passe par le message de la pipeline', () => {
    expect(ImportGenerationErrors.fromPipeline('scouting', abandon())).toBe(
      ImportGenerationErrors.abandoned(abandon())
    );
  });
});
