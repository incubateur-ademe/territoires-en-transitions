import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  fenetreAvisOuverte,
  instructeurCouvreCollectivite,
} from './pcaet-depot-permissions.rules';

const perimetre = {
  instructeurType: collectiviteTypeEnum.DREAL,
  instructeurRegionCode: '27',
  instructeurDepartementCode: null,
  collectiviteRegionCode: '27',
  collectiviteDepartementCode: '25',
};

describe('instructeurCouvreCollectivite', () => {
  it('a dreal covers a collectivite of its region', () => {
    expect(instructeurCouvreCollectivite(perimetre)).toBe(true);
  });

  it('a dreal does not cover another region', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        collectiviteRegionCode: '84',
      })
    ).toBe(false);
  });

  it('two missing region codes never match', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurRegionCode: null,
        collectiviteRegionCode: null,
      })
    ).toBe(false);
  });

  it('a missing code on either side never matches', () => {
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        collectiviteRegionCode: null,
      })
    ).toBe(false);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurRegionCode: null,
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
        instructeurDepartementCode: '01',
        collectiviteDepartementCode: '01',
      })
    ).toBe(true);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.DDT,
        instructeurDepartementCode: '01',
        collectiviteDepartementCode: '69',
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
        collectiviteRegionCode: '84',
      })
    ).toBe(false);
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
        instructeurRegionCode: null,
        instructeurDepartementCode: null,
      })
    ).toBe(true);
    expect(
      instructeurCouvreCollectivite({
        ...perimetre,
        instructeurType: collectiviteTypeEnum.SERVICE_NATIONAL,
        instructeurRegionCode: null,
        instructeurDepartementCode: null,
        collectiviteRegionCode: null,
        collectiviteDepartementCode: null,
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
