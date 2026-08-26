import { describe, expect, it } from 'vitest';
import { DemarchePcaetStatusEnum } from './demarche-pcaet-status.enum.schema';
import {
  getDemandeAvisEtat,
  PcaetDemandeAvisEtatEnum,
} from './pcaet-demande-avis-etat.rules';

const now = new Date('2026-08-11T10:00:00.000Z');
const echeanceAVenir = '2026-10-25T00:00:00.000Z';
const echeancePassee = '2026-07-12T00:00:00.000Z';

const demandeTransmise = {
  demarcheStatus: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  avisDeadlineAt: echeanceAVenir,
  nbAvisValides: 0,
  nbAvisBrouillons: 0,
};

describe('getDemandeAvisEtat', () => {
  it('sans avis, fenêtre ouverte : à traiter', () => {
    expect(getDemandeAvisEtat(demandeTransmise, now)).toBe(
      PcaetDemandeAvisEtatEnum.A_TRAITER
    );
  });

  it('un brouillon, fenêtre ouverte : brouillon en cours', () => {
    expect(
      getDemandeAvisEtat({ ...demandeTransmise, nbAvisBrouillons: 1 }, now)
    ).toBe(PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS);
  });

  it('un avis validé : avis rendu', () => {
    expect(
      getDemandeAvisEtat({ ...demandeTransmise, nbAvisValides: 1 }, now)
    ).toBe(PcaetDemandeAvisEtatEnum.AVIS_RENDU);
  });

  it('échéance passée, aucun avis validé : délai écoulé', () => {
    expect(
      getDemandeAvisEtat(
        { ...demandeTransmise, avisDeadlineAt: echeancePassee },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.DELAI_ECOULE);
  });

  it('échéance passée avec un brouillon jamais validé : délai écoulé', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          avisDeadlineAt: echeancePassee,
          nbAvisBrouillons: 1,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.DELAI_ECOULE);
  });

  it('démarche publiée sans avis : clos', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          demarcheStatus: DemarchePcaetStatusEnum.PUBLIE,
          avisDeadlineAt: echeancePassee,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.CLOS);
  });

  // Instruit sans avis n'est pas clos : le dossier a simplement vu son délai
  // expirer, et l'afficher « Archivé » induirait l'instructeur en erreur.
  it('démarche instruite sans avis : délai écoulé, pas clos', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          demarcheStatus: DemarchePcaetStatusEnum.INSTRUIT,
          avisDeadlineAt: echeancePassee,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.DELAI_ECOULE);
  });

  it('démarche archivée sans avis : clos', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          demarcheStatus: DemarchePcaetStatusEnum.ARCHIVE,
          avisDeadlineAt: echeancePassee,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.CLOS);
  });

  it('avis rendu prime sur clos', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          demarcheStatus: DemarchePcaetStatusEnum.PUBLIE,
          avisDeadlineAt: echeancePassee,
          nbAvisValides: 1,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.AVIS_RENDU);
  });

  it('reprise d’élaboration : la fenêtre reste ouverte', () => {
    expect(
      getDemandeAvisEtat(
        {
          ...demandeTransmise,
          demarcheStatus: DemarchePcaetStatusEnum.EN_ELABORATION,
        },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.A_TRAITER);
  });

  it('échéance absente : délai écoulé, jamais à traiter', () => {
    expect(
      getDemandeAvisEtat({ ...demandeTransmise, avisDeadlineAt: null }, now)
    ).toBe(PcaetDemandeAvisEtatEnum.DELAI_ECOULE);
  });

  it('le jour de l’échéance atteint ferme la fenêtre', () => {
    expect(
      getDemandeAvisEtat(
        { ...demandeTransmise, avisDeadlineAt: now.toISOString() },
        now
      )
    ).toBe(PcaetDemandeAvisEtatEnum.DELAI_ECOULE);
  });
});
