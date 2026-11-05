import {
  ObjetPreuveEnum,
  ParcoursLabellisation,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { getDemandeAvailability } from './demande-availability';

const CRITERES_ATTENDUS =
  'Renseigner tous les critères attendus afin de pouvoir demander un audit ou une labellisation';

const parcoursDemandable = {
  status: 'non_demandee',
  demande: null,
  labellisation: null,
  audit: null,
  completudeOk: true,
  critereScore: { atteint: true, scoreFait: 0.4 },
  isCot: false,
  etoiles: 2,
  conditionFichiers: { preuveNombre: 2 },
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  criteresAction: [
    { atteint: true, actionId: 'cae_5.1.2.1.1' },
    { atteint: true, actionId: 'cae_5.1.1.1.3' },
  ],
} as unknown as ParcoursLabellisation;

const toParcours = (
  overrides: Partial<ParcoursLabellisation>
): ParcoursLabellisation => ({ ...parcoursDemandable, ...overrides });

describe('getDemandeAvailability — audit de labellisation', () => {
  it("rend la demande possible quand tous les critères de l'étoile sont remplis", () => {
    expect(
      getDemandeAvailability({
        demande: {
          kind: 'audit-labellisation',
          sujet: SujetDemandeEnum.LABELLISATION,
          etoile: 2,
        },
        parcours: parcoursDemandable,
        isCOT: false,
        canAskFirstStar: false,
      })
    ).toEqual({ isRequestable: true });
  });

  it("bloque la troisième étoile d'une collectivité à 40 % : le score de l'étoile manque", () => {
    expect(
      getDemandeAvailability({
        demande: {
          kind: 'audit-labellisation',
          sujet: SujetDemandeEnum.LABELLISATION,
          etoile: 3,
        },
        parcours: toParcours({ etoiles: 3 }),
        isCOT: false,
        canAskFirstStar: false,
      })
    ).toEqual({ isRequestable: false, tooltip: CRITERES_ATTENDUS });
  });

  it("bloque l'audit COT avec labellisation sur une mesure non atteinte, même si l'audit COT seul serait possible", () => {
    expect(
      getDemandeAvailability({
        demande: {
          kind: 'audit-labellisation',
          sujet: SujetDemandeEnum.LABELLISATION_COT,
          etoile: 2,
        },
        parcours: toParcours({
          isCot: true,
          criteresAction: [
            { atteint: true, actionId: 'cae_5.1.2.1.1' },
            { atteint: false, actionId: 'cae_1.1.1' },
          ] as ParcoursLabellisation['criteresAction'],
        }),
        isCOT: true,
        canAskFirstStar: false,
      })
    ).toEqual({ isRequestable: false, tooltip: CRITERES_ATTENDUS });
  });
});

describe('getDemandeAvailability — audit COT seul', () => {
  it('bloque la demande tant que des statuts restent à renseigner', () => {
    expect(
      getDemandeAvailability({
        demande: { kind: 'audit-cot' },
        parcours: toParcours({ isCot: true, etoiles: 1, completudeOk: false }),
        isCOT: true,
        canAskFirstStar: false,
      })
    ).toEqual({
      isRequestable: false,
      tooltip: 'Renseigner les statuts de toutes les mesures du référentiel',
    });
  });

  it('rend la demande possible avec un référentiel complet, sans référent désigné ni score', () => {
    expect(
      getDemandeAvailability({
        demande: { kind: 'audit-cot' },
        parcours: toParcours({
          isCot: true,
          etoiles: 1,
          referentRolesDefined: {
            eluReferent: false,
            referentTechnique: false,
          },
          critereScore: {
            atteint: false,
            scoreFait: 0,
          } as ParcoursLabellisation['critereScore'],
        }),
        isCOT: true,
        canAskFirstStar: false,
      })
    ).toEqual({ isRequestable: true });
  });
});

describe('getDemandeAvailability — première étoile', () => {
  const premiereEtoile = {
    kind: 'premiere-etoile',
    sujet: SujetDemandeEnum.LABELLISATION,
  } as const;

  it('rend la demande possible quand les critères de la première étoile sont remplis', () => {
    expect(
      getDemandeAvailability({
        demande: premiereEtoile,
        parcours: toParcours({ etoiles: 1 }),
        isCOT: false,
        canAskFirstStar: true,
      })
    ).toEqual({ isRequestable: true });
  });

  it('bloque la demande tant que les critères de la première étoile ne sont pas remplis', () => {
    expect(
      getDemandeAvailability({
        demande: premiereEtoile,
        parcours: toParcours({ etoiles: 1 }),
        isCOT: false,
        canAskFirstStar: false,
      })
    ).toEqual({
      isRequestable: false,
      tooltip:
        'Tous les critères présents au tableau doivent être complétés pour pouvoir faire la demande de première étoile.',
    });
  });

  it("bloque une seconde demande tant que l'ADEME traite la première", () => {
    expect(
      getDemandeAvailability({
        demande: premiereEtoile,
        parcours: toParcours({
          etoiles: 1,
          status: 'demande_envoyee',
          demande: {
            sujet: SujetDemandeEnum.LABELLISATION,
            etoiles: '1',
          } as ParcoursLabellisation['demande'],
        }),
        isCOT: false,
        canAskFirstStar: true,
      })
    ).toEqual({
      isRequestable: false,
      tooltip:
        "Votre demande de première étoile a déjà été envoyée et est en cours de traitement par l'ADEME.",
    });
  });
});
