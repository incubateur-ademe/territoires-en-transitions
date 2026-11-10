import { describe, expect, it } from 'vitest';
import { countAvis, listBlocagesDossier } from './track-snapshot.rules';

describe('listBlocagesDossier', () => {
  it('dit ce qui retient la transmission, sans le guard du pilote', () => {
    expect(
      listBlocagesDossier('en_elaboration', {
        estPilote: false,
        dossierComplet: false,
      })
    ).toEqual({
      transitionsAtteignables: ['transmettre_pour_avis'],
      bloquePar: ['dossierComplet'],
    });
  });

  it("n'annonce aucun blocage quand rien ne retient le dossier", () => {
    expect(
      listBlocagesDossier('en_elaboration', {
        estPilote: false,
        dossierComplet: true,
      }).bloquePar
    ).toEqual([]);
  });
});

describe('countAvis', () => {
  it('compte les avis attendus et rendus de chaque saisine', () => {
    expect(
      countAvis([
        { titresAttendus: ['prefet_region'], titresValides: ['prefet_region'] },
        { titresAttendus: ['president_region'], titresValides: [] },
        { titresAttendus: [], titresValides: [] },
      ])
    ).toEqual({ nbSaisines: 3, avisAttendus: 2, avisRendus: 1 });
  });
});
