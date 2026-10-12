import { describe, expect, it } from 'vitest';
import { toFicheLink } from './fiche-link.utils';

describe('toFicheLink', () => {
  it('mène à la page de la fiche, dans sa propre collectivité, quand elle n est pas restreinte', () => {
    expect(
      toFicheLink({ id: 34, collectiviteId: 12, restreint: false })
    ).toContain('/collectivite/12/actions/34');
  });

  it('mène à la page de la fiche quand sa confidentialité n est pas renseignée', () => {
    expect(
      toFicheLink({ id: 34, collectiviteId: 12, restreint: null })
    ).toContain('/collectivite/12/actions/34');
  });

  it('ne mène nulle part quand la fiche est restreinte', () => {
    expect(
      toFicheLink({ id: 34, collectiviteId: 12, restreint: true })
    ).toBeUndefined();
  });
});
