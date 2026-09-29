import { describe, expect, it } from 'vitest';
import { DocumentRattache } from './bibliotheque/types';
import { toDocumentTargets } from './to-document-target';

const collectiviteId = 1;

const demande = { id: 7, collectiviteId, referentiel: 'cae' };

const demandeTarget = {
  type: 'demandeLabellisation',
  collectiviteId,
  demandeId: 7,
  referentielId: 'cae',
};

const toDocumentRattache = (fields: object): DocumentRattache =>
  ({ collectiviteId, ...fields } as unknown as DocumentRattache);

describe('toDocumentTargets', () => {
  it("vise l'attendu réglementaire pour une preuve réglementaire", () => {
    expect(
      toDocumentTargets(toDocumentRattache({ preuveType: 'reglementaire' }))
    ).toEqual([{ type: 'preuveReglementaire', collectiviteId }]);
  });

  it('vise la mesure pour une preuve complémentaire, rattachée à une action', () => {
    expect(
      toDocumentTargets(toDocumentRattache({ preuveType: 'complementaire' }))
    ).toEqual([{ type: 'mesure', collectiviteId }]);
  });

  it('ne vise que la fiche pour une annexe, absente des listes du référentiel', () => {
    expect(
      toDocumentTargets(toDocumentRattache({ preuveType: 'annexe' }))
    ).toEqual([{ type: 'ficheAction' }]);
  });

  it("ne vise que le listing du référentiel pour un rapport de visite, qui n'est ni une preuve d'action ni un document de mesure", () => {
    expect(
      toDocumentTargets(toDocumentRattache({ preuveType: 'rapport' }))
    ).toEqual([{ type: 'rapportVisite' }]);
  });

  it('reporte la demande et son référentiel pour une preuve de candidature', () => {
    expect(
      toDocumentTargets(
        toDocumentRattache({ preuveType: 'labellisation', demande })
      )
    ).toEqual([demandeTarget]);
  });

  it("vise l'audit seul quand le document d'audit n'est rattaché à aucune demande", () => {
    expect(
      toDocumentTargets(
        toDocumentRattache({
          preuveType: 'audit',
          audit: { id: 3 },
          demande: null,
        })
      )
    ).toEqual([{ type: 'audit', collectiviteId, auditId: 3 }]);
  });

  it("vise aussi la demande quand le document d'audit lui est rattaché", () => {
    expect(
      toDocumentTargets(
        toDocumentRattache({
          preuveType: 'audit',
          audit: { id: 3 },
          demande,
        })
      )
    ).toEqual([{ type: 'audit', collectiviteId, auditId: 3 }, demandeTarget]);
  });
});
