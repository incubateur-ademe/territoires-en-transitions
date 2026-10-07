import { describe, expect, it } from 'vitest';
import {
  canAutoAttachEmail,
  isAutoAttachableType,
} from './auto-attachment.rules';
import { collectiviteTypeEnum } from './collectivite-type.enum';

const SIREN_ADEME = '385290309';

describe('isAutoAttachableType', () => {
  it('accepts the state services', () => {
    expect(isAutoAttachableType(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(isAutoAttachableType(collectiviteTypeEnum.DDT)).toBe(true);
    expect(isAutoAttachableType(collectiviteTypeEnum.DR_ADEME)).toBe(true);
    expect(isAutoAttachableType(collectiviteTypeEnum.SERVICE_NATIONAL)).toBe(
      true
    );
  });

  /** Instructeur sans être un service déconcentré : il se rejoint quand même. */
  it('accepts a conseil regional', () => {
    expect(isAutoAttachableType(collectiviteTypeEnum.REGION)).toBe(true);
  });

  /** Rien ne dit qu'un agent public est employé de la commune qu'il désigne. */
  it('refuses the collectivites that keep the invitation path', () => {
    expect(isAutoAttachableType(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isAutoAttachableType(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isAutoAttachableType(collectiviteTypeEnum.DEPARTEMENT)).toBe(false);
    expect(isAutoAttachableType(collectiviteTypeEnum.TEST)).toBe(false);
  });
});

describe('canAutoAttachEmail', () => {
  it('lets any address in where no domain is required', () => {
    expect(
      canAutoAttachEmail({ siren: '130017205', email: 'agent@example.org' })
    ).toBe(true);
    expect(
      canAutoAttachEmail({ siren: null, email: 'agent@example.org' })
    ).toBe(true);
  });

  it('requires the declared domain of the ademe', () => {
    expect(
      canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent@ademe.fr' })
    ).toBe(true);
    expect(
      canAutoAttachEmail({ siren: SIREN_ADEME, email: 'Agent@ADEME.FR' })
    ).toBe(true);
    expect(
      canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent@example.org' })
    ).toBe(false);
  });

  /**
   * Ni sous-domaine, ni domaine dont le nom requis n'est qu'un suffixe : sans
   * savoir lesquels sont légitimes, la correspondance reste exacte.
   */
  it('refuses a subdomain and a lookalike', () => {
    expect(
      canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent@dr.ademe.fr' })
    ).toBe(false);
    expect(
      canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent@notademe.fr' })
    ).toBe(false);
  });

  it('refuses an address without a domain', () => {
    expect(canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent' })).toBe(
      false
    );
    expect(canAutoAttachEmail({ siren: SIREN_ADEME, email: 'agent@' })).toBe(
      false
    );
  });
});
