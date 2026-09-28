import { AppRouter } from '@tet/api';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { describe, expect, it } from 'vitest';
import { queryKeysToInvalidate, type DocumentTarget } from './document-target';

const trpc = {
  referentiels: {
    documents: {
      listDocumentsReferentiel: { pathKey: () => ['listDocumentsReferentiel'] },
      listDocumentsMesure: { pathKey: () => ['listDocumentsMesure'] },
      listDocumentsAudit: {
        queryKey: ({ auditId }: { auditId: number }) => [
          'listDocumentsAudit',
          auditId,
        ],
      },
      listDocumentsDemandeLabellisation: {
        queryKey: ({ demandeId }: { demandeId: number }) => [
          'listDocumentsDemandeLabellisation',
          demandeId,
        ],
      },
    },
    actions: {
      countPreuves: {
        queryKey: ({ collectiviteId }: { collectiviteId: number }) => [
          'countPreuves',
          collectiviteId,
        ],
      },
    },
    labellisations: {
      getParcours: {
        queryKey: ({
          collectiviteId,
          referentielId,
        }: {
          collectiviteId: number;
          referentielId: string;
        }) => ['getParcours', collectiviteId, referentielId],
      },
    },
  },
  plans: { fiches: { ficheAnnexes: { pathKey: () => ['ficheAnnexes'] } } },
} as unknown as TRPCOptionsProxy<AppRouter>;

const collectiviteId = 1;

const referentielKeys = [
  ['listDocumentsReferentiel'],
  ['listDocumentsMesure'],
  ['countPreuves', collectiviteId],
];

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
});
