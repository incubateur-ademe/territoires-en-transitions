import { describe, expect, it } from 'vitest';
import { availableAuditTypes } from './available-audit-types';

describe('availableAuditTypes', () => {
  it("COT avec score < 35% : aucun sujet n'est proposé", () => {
    expect(
      availableAuditTypes({ isCOT: true, canRequestLabellisation: false })
    ).toEqual([]);
  });

  it('COT avec score >= 35% : les trois sujets sont proposés', () => {
    expect(
      availableAuditTypes({ isCOT: true, canRequestLabellisation: true })
    ).toEqual(['cot', 'labellisation_cot', 'labellisation']);
  });

  it("non-COT avec score < 35% : aucun sujet n'est proposé", () => {
    expect(
      availableAuditTypes({ isCOT: false, canRequestLabellisation: false })
    ).toEqual([]);
  });

  it("non-COT avec score >= 35% : seul l'audit de labellisation est proposé", () => {
    expect(
      availableAuditTypes({ isCOT: false, canRequestLabellisation: true })
    ).toEqual(['labellisation']);
  });
});
