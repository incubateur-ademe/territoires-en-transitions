import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  DGEC_SIREN,
  isDgec,
  isOrganismeReferentPcaet,
} from './pcaet-referent.rules';

describe('isOrganismeReferentPcaet', () => {
  it('retient la DREAL, le Conseil régional et la DDT', () => {
    expect(isOrganismeReferentPcaet(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(isOrganismeReferentPcaet(collectiviteTypeEnum.REGION)).toBe(true);
    expect(isOrganismeReferentPcaet(collectiviteTypeEnum.DDT)).toBe(true);
  });

  it('écarte les autres services saisis et les collectivités', () => {
    expect(isOrganismeReferentPcaet(collectiviteTypeEnum.DR_ADEME)).toBe(false);
    expect(
      isOrganismeReferentPcaet(collectiviteTypeEnum.SERVICE_NATIONAL)
    ).toBe(false);
    expect(isOrganismeReferentPcaet(collectiviteTypeEnum.EPCI)).toBe(false);
  });
});

describe('isDgec', () => {
  it('reconnaît la DGEC à son SIREN', () => {
    expect(
      isDgec({ type: collectiviteTypeEnum.SERVICE_NATIONAL, siren: DGEC_SIREN })
    ).toBe(true);
  });

  it("n'est pas l'ADEME nationale, autre service national", () => {
    expect(
      isDgec({
        type: collectiviteTypeEnum.SERVICE_NATIONAL,
        siren: '385290309',
      })
    ).toBe(false);
  });

  it('exige le type service national, pas seulement le SIREN', () => {
    expect(
      isDgec({ type: collectiviteTypeEnum.DREAL, siren: DGEC_SIREN })
    ).toBe(false);
  });
});
