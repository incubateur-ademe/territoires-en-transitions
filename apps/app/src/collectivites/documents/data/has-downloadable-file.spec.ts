import { describe, expect, it } from 'vitest';
import { hasDownloadableFile } from './has-downloadable-file';
import { MesureDocumentsState } from './use-list-documents-mesure';

type LoadedDocuments = Extract<MesureDocumentsState, { status: 'loaded' }>;
type DocumentSupport = Pick<LoadedDocuments['complementaires'][number], 'type'>;

const toFichier = (): DocumentSupport => ({ type: 'fichier' });
const toLien = (): DocumentSupport => ({ type: 'lien' });

const toDocuments = ({
  attendus = [],
  complementaires = [],
}: {
  attendus?: DocumentSupport[][];
  complementaires?: DocumentSupport[];
}): MesureDocumentsState =>
  ({
    status: 'loaded',
    attendus: attendus.map((documents) => ({ documents })),
    complementaires,
  } as unknown as MesureDocumentsState);

describe('hasDownloadableFile', () => {
  it('rend faux tant que les documents ne sont pas chargés', () => {
    expect(hasDownloadableFile({ status: 'loading' })).toBe(false);
    expect(hasDownloadableFile({ status: 'error' })).toBe(false);
  });

  it('rend vrai quand un attendu porte un fichier', () => {
    expect(
      hasDownloadableFile(toDocuments({ attendus: [[toFichier()]] }))
    ).toBe(true);
  });

  it('rend vrai quand un complémentaire porte un fichier', () => {
    expect(
      hasDownloadableFile(toDocuments({ complementaires: [toFichier()] }))
    ).toBe(true);
  });

  it('rend faux quand la mesure ne porte que des liens', () => {
    expect(
      hasDownloadableFile(
        toDocuments({ attendus: [[toLien()]], complementaires: [toLien()] })
      )
    ).toBe(false);
  });

  it('rend faux quand la mesure ne porte aucun document', () => {
    expect(hasDownloadableFile(toDocuments({ attendus: [[]] }))).toBe(false);
  });
});
