import { describe, expect, it } from 'vitest';
import { DemarchePcaetStatusEnum } from './demarche-pcaet-status.enum.schema';
import {
  getDemandeAvisEtat,
  getEtatDossierEnLecture,
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

describe('getEtatDossierEnLecture', () => {
  const attenduDreal = {
    titresAttendus: ['prefet_region', 'autorite_environnementale'],
    titresValides: [] as string[],
  };
  const attenduRegion = {
    titresAttendus: ['president_region'],
    titresValides: [] as string[],
  };
  const dansUnMois = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const hier = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  it('dit le dossier instruit dès que tous les titres attendus sont rendus', () => {
    expect(
      getEtatDossierEnLecture(
        {
          demarcheStatus: 'transmis_pour_avis',
          avisDeadlineAt: dansUnMois,
          achevement: [
            {
              ...attenduDreal,
              titresValides: ['prefet_region', 'autorite_environnementale'],
            },
            { ...attenduRegion, titresValides: ['president_region'] },
          ],
        } as never,
        new Date()
      )
    ).toBe('avis_rendu');
  });

  /**
   * Le point du correctif : une DDT lisait « Pas d'avis déposé » sur un dossier
   * dont tous les avis étaient rendus, parce que l'état se calculait sur sa
   * propre demande — vide par nature.
   */
  it("ne dit pas « pas d'avis déposé » quand il reste un titre à rendre, fenêtre ouverte", () => {
    expect(
      getEtatDossierEnLecture(
        {
          demarcheStatus: 'transmis_pour_avis',
          avisDeadlineAt: dansUnMois,
          achevement: [
            { ...attenduDreal, titresValides: ['prefet_region'] },
            attenduRegion,
          ],
        } as never,
        new Date()
      )
    ).toBe('a_traiter');
  });

  it('dit le délai écoulé quand la fenêtre est fermée sans tous les avis', () => {
    expect(
      getEtatDossierEnLecture(
        {
          demarcheStatus: 'transmis_pour_avis',
          avisDeadlineAt: hier,
          achevement: [attenduDreal, attenduRegion],
        } as never,
        new Date()
      )
    ).toBe('delai_ecoule');
  });

  it('dit le dossier clos une fois la démarche sortie du circuit', () => {
    expect(
      getEtatDossierEnLecture(
        {
          demarcheStatus: 'publie',
          avisDeadlineAt: hier,
          achevement: [attenduDreal],
        } as never,
        new Date()
      )
    ).toBe('clos');
  });
});
