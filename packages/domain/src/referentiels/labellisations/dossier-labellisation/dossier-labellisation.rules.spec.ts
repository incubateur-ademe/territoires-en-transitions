import { describe, expect, it } from 'vitest';
import {
  canDecideDossierLabellisation,
  getDossierLabellisationStatut,
} from './dossier-labellisation.rules';

const audit = { clos: false, valide: false, dateDebut: null };
const demandeLabellisation = { etoiles: '3', sujet: 'labellisation' } as const;
const demandePremiereEtoile = { etoiles: '1', sujet: 'labellisation' } as const;

describe('getDossierLabellisationStatut', () => {
  it('une demande envoyée sans audit démarré est « demande envoyée »', () => {
    expect(
      getDossierLabellisationStatut({ audit, demande: demandeLabellisation })
    ).toBe('demande_envoyee');
  });

  it('une demande de 1ère étoile non auditée est « 1ère étoile à valider »', () => {
    expect(
      getDossierLabellisationStatut({ audit, demande: demandePremiereEtoile })
    ).toBe('premiere_etoile_a_valider');
  });

  it('un audit démarré prime sur la demande de 1ère étoile', () => {
    expect(
      getDossierLabellisationStatut({
        audit: { ...audit, dateDebut: '2026-01-01' },
        demande: demandePremiereEtoile,
      })
    ).toBe('audit_en_cours');
  });

  it('un audit validé non clos est « audit validé »', () => {
    expect(
      getDossierLabellisationStatut({
        audit: { ...audit, dateDebut: '2026-01-01', valide: true },
        demande: demandeLabellisation,
      })
    ).toBe('audit_valide');
  });

  it('un audit clos est « clos », quel que soit le reste', () => {
    expect(
      getDossierLabellisationStatut({
        audit: { clos: true, valide: true, dateDebut: '2026-01-01' },
        demande: demandeLabellisation,
      })
    ).toBe('clos');
  });
});

describe('canDecideDossierLabellisation', () => {
  const auditValide = { clos: false, valide: true, dateDebut: '2026-01-01' };

  it('on ne labellise qu’un audit validé portant sur une labellisation', () => {
    expect(
      canDecideDossierLabellisation(
        { audit: auditValide, demande: demandeLabellisation },
        'labelliser'
      )
    ).toBe(true);
    expect(
      canDecideDossierLabellisation(
        { audit: auditValide, demande: { etoiles: null, sujet: 'cot' } },
        'labelliser'
      )
    ).toBe(false);
    expect(
      canDecideDossierLabellisation(
        { audit, demande: demandeLabellisation },
        'labelliser'
      )
    ).toBe(false);
  });

  it('on ne valide une 1ère étoile que pour une demande de 1ère étoile non auditée', () => {
    expect(
      canDecideDossierLabellisation(
        { audit, demande: demandePremiereEtoile },
        'valider_premiere_etoile'
      )
    ).toBe(true);
    expect(
      canDecideDossierLabellisation(
        { audit, demande: demandeLabellisation },
        'valider_premiere_etoile'
      )
    ).toBe(false);
  });

  it('on peut clore tout dossier non clos', () => {
    expect(
      canDecideDossierLabellisation(
        { audit, demande: demandeLabellisation },
        'clore'
      )
    ).toBe(true);
    expect(
      canDecideDossierLabellisation(
        { audit: { ...auditValide, clos: true }, demande: null },
        'clore'
      )
    ).toBe(false);
  });
});
