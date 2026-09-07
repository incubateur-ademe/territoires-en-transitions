import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  fenetreAvisOuverte,
  instructeurCouvreCollectivite,
} from './pcaet-depot-permissions.rules';

const perimetre = {
  instructeurType: collectiviteTypeEnum.DREAL,
  instructeurRegionCodes: ['27'],
  instructeurDepartementCodes: [],
  collectiviteRegionCodes: ['27'],
  collectiviteDepartementCodes: ['25'],
};

describe('instructeurCouvreCollectivite', () => {
  it('a dreal covers a collectivite of its region', () => {
    expect(instructeurCouvreCollectivite(perimetre)).toBe(true);
  });

  it('a dreal does not cover another region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        collectiviteRegionCodes: ['84'],
      })
    ).toBe(false);
  });

  it('two empty territories never match', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurRegionCodes: [],
        collectiviteRegionCodes: [],
      })
    ).toBe(false);
  });

  it('an empty territory on either side never matches', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        collectiviteRegionCodes: [],
      })
    ).toBe(false);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurRegionCodes: [],
      })
    ).toBe(false);
  });

  it('a non-instructeur type never covers, even on matching codes', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.EPCI,
      })
    ).toBe(false);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.COMMUNE,
      })
    ).toBe(false);
  });

  /** Le conseil régional couvre sa région, comme la DREAL — en lecture. */
  it('a region covers its own region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.REGION,
      })
    ).toBe(true);
  });

  it('a ddt covers its department, not its region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DDT,
        instructeurDepartementCodes: ['01'],
        collectiviteDepartementCodes: ['01'],
      })
    ).toBe(true);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DDT,
        instructeurDepartementCodes: ['01'],
        collectiviteDepartementCodes: ['69'],
      })
    ).toBe(false);
  });

  /** La DR ADEME est le profil de la DDT transposé à la maille région. */
  it('a dr ademe covers its region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DR_ADEME,
      })
    ).toBe(true);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DR_ADEME,
        collectiviteRegionCodes: ['84'],
      })
    ).toBe(false);
  });

  /**
   * La DR ADEME Océan Indien : une seule ligne, deux régions. La seconde lui
   * vient d'un périmètre secondaire, et couvre autant que la première.
   */
  it('an instructeur covers a collectivite of its secondary region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DR_ADEME,
        instructeurRegionCodes: ['04', '06'],
        collectiviteRegionCodes: ['06'],
      })
    ).toBe(true);
  });

  /**
   * Et réciproquement : un EPCI qui chevauche deux régions — Redon
   * Agglomération, Pays de la Loire et Bretagne — est couvert par la DREAL de
   * chacune, pas seulement par celle de son siège.
   */
  it('an instructeur covers a collectivite spanning into its region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        collectiviteRegionCodes: ['53', '27'],
      })
    ).toBe(true);
  });

  it('a ddt covers a collectivite spanning into its department', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DDT,
        instructeurDepartementCodes: ['35'],
        collectiviteDepartementCodes: ['44', '56', '35'],
      })
    ).toBe(true);
  });

  /**
   * Le périmètre national ne se compare à rien : il couvre même une
   * collectivité dont aucun code géographique n'est renseigné, là où tous les
   * autres périmètres refusent faute de code à confronter.
   */
  it('a national service covers everything, codes or not', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.SERVICE_NATIONAL,
        instructeurRegionCodes: [],
        instructeurDepartementCodes: [],
      })
    ).toBe(true);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.SERVICE_NATIONAL,
        instructeurRegionCodes: [],
        instructeurDepartementCodes: [],
        collectiviteRegionCodes: [],
        collectiviteDepartementCodes: [],
      })
    ).toBe(true);
  });
});

describe('fenetreAvisOuverte', () => {
  const now = new Date('2026-08-07T10:00:00Z');
  const demain = '2026-08-08T10:00:00.000Z';
  const hier = '2026-08-06T10:00:00.000Z';

  it('open while transmis_pour_avis and before the deadline', () => {
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'transmis_pour_avis', avisDeadlineAt: demain },
        now
      )
    ).toBe(true);
  });

  it('stays open during a reprise d elaboration', () => {
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'en_elaboration', avisDeadlineAt: demain },
        now
      )
    ).toBe(true);
  });

  it('closed once the instruction is over, published or archived', () => {
    // L'échéance est encore dans le futur : c'est le statut qui ferme, et c'est
    // tout le verrouillage du dossier côté instructeur.
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'instruit', avisDeadlineAt: demain },
        now
      )
    ).toBe(false);
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'publie', avisDeadlineAt: demain },
        now
      )
    ).toBe(false);
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'archive', avisDeadlineAt: demain },
        now
      )
    ).toBe(false);
  });

  it('closed once the deadline is reached, boundary included', () => {
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'transmis_pour_avis', avisDeadlineAt: hier },
        now
      )
    ).toBe(false);
    expect(
      fenetreAvisOuverte(
        {
          demarcheStatus: 'transmis_pour_avis',
          avisDeadlineAt: now.toISOString(),
        },
        now
      )
    ).toBe(false);
  });

  it('closed when no deadline is stamped', () => {
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'transmis_pour_avis', avisDeadlineAt: null },
        now
      )
    ).toBe(false);
  });
});
