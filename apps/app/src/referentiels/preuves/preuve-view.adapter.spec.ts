import { describe, expect, test } from 'vitest';
import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireLienSameAttendu,
  preuveReglementaireLienSansDescription,
  preuveReglementaireNonRenseignee,
} from './Bibliotheque/fixture';
import {
  AuditFromView,
  toAuditEnCours,
  toDocumentsAttendus,
} from './preuve-view.adapter';

const auditFromView: AuditFromView = {
  id: 101,
  collectivite_id: 1,
  demande_id: null,
  date_debut: '2023-02-22T18:34:42.460935+00:00',
  date_fin: null,
  clos: false,
  valide: true,
  referentiel: 'cae',
};

describe('toAuditEnCours', () => {
  test('expose le référentiel sous referentiel_id, seule clé que consomme l’application', () => {
    expect(toAuditEnCours(auditFromView).referentiel_id).toBe('cae');
  });

  test('ne laisse pas fuiter la clé referentiel de la vue', () => {
    expect(toAuditEnCours(auditFromView)).not.toHaveProperty('referentiel');
  });

  test('conserve les autres champs de l’audit', () => {
    expect(toAuditEnCours(auditFromView)).toMatchObject({
      id: 101,
      collectivite_id: 1,
      demande_id: null,
      date_debut: '2023-02-22T18:34:42.460935+00:00',
      date_fin: null,
      clos: false,
      valide: true,
    });
  });
});

describe('toDocumentsAttendus', () => {
  test('regroupe les deux dépôts répondant au même attendu', () => {
    expect(
      toDocumentsAttendus([
        preuveReglementaireFichier,
        preuveReglementaireLienSameAttendu,
      ])
    ).toEqual([
      {
        action: preuveReglementaireFichier.action,
        preuve_reglementaire: preuveReglementaireFichier.preuve_reglementaire,
        documents: [
          preuveReglementaireFichier,
          preuveReglementaireLienSameAttendu,
        ],
      },
    ]);
  });

  test("sépare les deux attendus d'une même mesure", () => {
    const attendus = toDocumentsAttendus([
      preuveReglementaireFichier,
      preuveReglementaireLien,
    ]);

    expect(
      attendus.map(({ preuve_reglementaire }) => preuve_reglementaire.id)
    ).toEqual(['etude_vulnerabilite', 'agenda']);
  });

  test('ne fusionne pas un même attendu porté par deux mesures différentes', () => {
    const attendus = toDocumentsAttendus([
      preuveReglementaireFichier,
      preuveReglementaireLienSansDescription,
    ]);

    expect(attendus.map(({ action }) => action.action_id)).toEqual([
      'eci_1.1.3',
      'eci_1.1.4',
    ]);
  });

  test("rend une liste de documents vide quand l'attendu n'a reçu aucun dépôt", () => {
    expect(toDocumentsAttendus([preuveReglementaireNonRenseignee])).toEqual([
      {
        action: preuveReglementaireNonRenseignee.action,
        preuve_reglementaire:
          preuveReglementaireNonRenseignee.preuve_reglementaire,
        documents: [],
      },
    ]);
  });
});
