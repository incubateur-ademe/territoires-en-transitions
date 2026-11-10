import { describe, expect, it } from 'vitest';
import {
  buildDemarchePcaetEventProperties,
  daysBetween,
  getDemarchePcaetDistinctId,
} from './demarche-pcaet-tracking.rules';

const subject = {
  id: 12,
  collectiviteId: 345,
  status: 'transmis_pour_avis',
  obligation: 'obligatoire',
  transmittedOffPlatform: false,
  isScotAec: true,
} as const;

describe('buildDemarchePcaetEventProperties', () => {
  it('pose les propriétés communes de la démarche et de l’acteur', () => {
    expect(
      buildDemarchePcaetEventProperties(subject, {
        acteur: 'instructeur',
        instructeurType: 'dreal',
        perimetreSaisine: 'principal',
      })
    ).toEqual({
      demarche_id: 12,
      collectivite_id: 345,
      demarche_status: 'transmis_pour_avis',
      demarche_obligation: 'obligatoire',
      transmitted_off_platform: false,
      is_scot_aec: true,
      acteur: 'instructeur',
      instructeur_type: 'dreal',
      perimetre_saisine: 'principal',
    });
  });

  it('écrit les propriétés propres en snake_case', () => {
    expect(
      buildDemarchePcaetEventProperties(
        subject,
        { acteur: 'collectivite' },
        { joursDepuisTransmission: 3, blockedByAll: ['estPilote'] }
      )
    ).toMatchObject({
      jours_depuis_transmission: 3,
      blocked_by_all: ['estPilote'],
    });
  });

  it('ne laisse pas une propriété propre écraser une propriété commune', () => {
    expect(
      buildDemarchePcaetEventProperties(
        subject,
        { acteur: 'collectivite' },
        { demarcheStatus: 'publie' }
      ).demarche_status
    ).toBe('transmis_pour_avis');
  });

  it('laisse vides les champs que la référence ne porte pas', () => {
    const properties = buildDemarchePcaetEventProperties(
      { id: 1, collectiviteId: 2, status: 'en_elaboration' },
      { acteur: 'systeme' }
    );
    expect(properties.demarche_obligation).toBeUndefined();
    expect(properties.instructeur_type).toBeUndefined();
  });
});

describe('getDemarchePcaetDistinctId', () => {
  it('impute l’événement à l’utilisateur qui agit', () => {
    expect(getDemarchePcaetDistinctId(subject, 'user-1')).toEqual({
      distinctId: 'user-1',
      isPerson: true,
    });
  });

  it('rattache une bascule sans acteur à la démarche', () => {
    expect(getDemarchePcaetDistinctId(subject, null)).toEqual({
      distinctId: 'demarche:12',
      isPerson: false,
    });
  });
});

describe('daysBetween', () => {
  it('compte les jours pleins', () => {
    expect(
      daysBetween('2026-11-01T10:00:00Z', new Date('2026-11-04T09:00:00Z'))
    ).toBe(2);
  });

  it('est nul sans date de départ', () => {
    expect(daysBetween(null)).toBeNull();
  });
});
