import { describe, expect, it } from 'vitest';
import {
  fakeDocumentTrpc as trpc,
  toReferentielQueryKeys,
} from './document-query-keys.fixture';
import { queryKeysToInvalidate, type DocumentTarget } from './document-target';

const collectiviteId = 1;

const referentielKeys = toReferentielQueryKeys(collectiviteId);

describe('queryKeysToInvalidate', () => {
  it('rafraîchit le décompte de preuves et les deux listes du référentiel pour une mesure', () => {
    const target: DocumentTarget = { type: 'mesure', collectiviteId };

    expect(queryKeysToInvalidate(trpc, target)).toEqual(referentielKeys);
  });

  it('rafraîchit le même lot pour une preuve réglementaire, rattachée elle aussi à une action', () => {
    const target: DocumentTarget = {
      type: 'preuveReglementaire',
      collectiviteId,
    };

    expect(queryKeysToInvalidate(trpc, target)).toEqual(referentielKeys);
  });

  it("ne rafraîchit que la liste du référentiel pour un rapport de visite, qui n'est ni une preuve d'action ni un document de mesure", () => {
    const target: DocumentTarget = { type: 'rapportVisite' };

    expect(queryKeysToInvalidate(trpc, target)).toEqual([
      ['listDocumentsReferentiel'],
    ]);
  });

  it('ajoute la demande et le parcours de labellisation à une preuve de candidature', () => {
    const target: DocumentTarget = {
      type: 'demandeLabellisation',
      collectiviteId,
      demandeId: 7,
      referentielId: 'cae',
    };

    expect(queryKeysToInvalidate(trpc, target)).toEqual([
      ...referentielKeys,
      ['listDocumentsDemandeLabellisation', 7],
      ['getParcours', collectiviteId, 'cae'],
    ]);
  });

  it("ajoute la liste de l'audit ciblé, et de lui seul", () => {
    const target: DocumentTarget = {
      type: 'audit',
      collectiviteId,
      auditId: 3,
    };

    expect(queryKeysToInvalidate(trpc, target)).toEqual([
      ...referentielKeys,
      ['listDocumentsAudit', 3],
    ]);
  });

  it('ne rafraîchit que les annexes de fiche pour une fiche action', () => {
    const target: DocumentTarget = { type: 'ficheAction' };

    expect(queryKeysToInvalidate(trpc, target)).toEqual([['ficheAnnexes']]);
  });

  it('rafraîchit toutes les listes qui nomment un fichier quand celui-ci est renommé', () => {
    const target: DocumentTarget = {
      type: 'bibliothequeFichier',
      collectiviteId,
    };

    expect(queryKeysToInvalidate(trpc, target)).toEqual([
      ...referentielKeys,
      ['listBibliothequeDocuments'],
      ['ficheAnnexes'],
      ['listDocumentsDemandeLabellisation'],
    ]);
  });
});
