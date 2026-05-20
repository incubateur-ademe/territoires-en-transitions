import { getViewerRole } from './get-viewer-role';

describe('getViewerRole', () => {
  it('retourne `auditor` quand isAuditor est vrai', () => {
    expect(getViewerRole({ isAuditor: true, canMutate: false })).toBe(
      'auditor'
    );
  });

  it('retourne `auditor` même si la permission de mutation est aussi présente (auditor prime)', () => {
    expect(getViewerRole({ isAuditor: true, canMutate: true })).toBe(
      'auditor'
    );
  });

  it('retourne `auditee` quand le viewer peut muter le référentiel sans être auditor', () => {
    expect(getViewerRole({ isAuditor: false, canMutate: true })).toBe(
      'auditee'
    );
  });

  it('retourne `other` quand le viewer n\'est ni auditor ni mutateur', () => {
    expect(getViewerRole({ isAuditor: false, canMutate: false })).toBe('other');
  });
});
