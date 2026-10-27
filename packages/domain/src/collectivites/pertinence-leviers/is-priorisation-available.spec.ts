import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../collectivite-type.enum';
import { isPriorisationAvailable } from './is-priorisation-available';

describe('isPriorisationAvailable', () => {
  it("n'ouvre l'aide à la priorisation qu'aux EPCI", () => {
    const typesWithPriorisation = Object.values(collectiviteTypeEnum).filter(
      isPriorisationAvailable
    );

    expect(typesWithPriorisation).toEqual([collectiviteTypeEnum.EPCI]);
  });
});
