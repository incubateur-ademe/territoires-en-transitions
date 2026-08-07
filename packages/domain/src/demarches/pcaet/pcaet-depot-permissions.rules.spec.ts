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
        instructeurType: collectiviteTypeEnum.REGION,
      })
    ).toBe(false);
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

  it('closed once the demarche is adopted or archived', () => {
    expect(
      fenetreAvisOuverte(
        { demarcheStatus: 'adopte', avisDeadlineAt: demain },
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
