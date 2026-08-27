import { describe, expect, test } from 'vitest';
import { AuditFromView, toAuditEnCours } from './preuve-view.adapter';

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
