import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { getReferentielDisplayMap } from '@tet/domain/collectivites';
import { isNavDropdown } from '@tet/ui';
import { generateEdlDropdown } from './generate-edl-dropdown';
import { filterNavItems } from './make-collectivite-nav';

const toVisibleLinks = (
  referentielsPreferences: CollectiviteReferentielPreferences,
  isDemarchePcaetEnabled = true
) => {
  const [dropdown] = filterNavItems([
    generateEdlDropdown({
      collectiviteId: 20,
      collectiviteAccesRestreint: false,
      isVisitor: false,
      referentielsDisplay: getReferentielDisplayMap(referentielsPreferences),
      referentielsPreferences,
      isDemarchePcaetEnabled,
    }),
  ]);
  if (!isNavDropdown(dropdown)) {
    throw new Error('Le menu EDL doit être un menu déroulant');
  }
  return dropdown.links.map((link) => link.dataTest);
};

describe('generateEdlDropdown', () => {
  it("garde l'ordre historique quand aucun référentiel n'est archivé", () => {
    expect(
      toVisibleLinks({
        cae: { display: true, mode: 'write' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      })
    ).toEqual(['edl-cae', 'edl-eci', 'edl-te', 'edl-demarche-pcaet']);
  });

  it('place un référentiel archivé avant bascule après les référentiels actifs, avant la démarche PCAET', () => {
    expect(
      toVisibleLinks({
        cae: { display: true, mode: 'archived' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      })
    ).toEqual(['edl-eci', 'edl-te', 'edl-cae', 'edl-demarche-pcaet']);
  });

  it('regroupe les référentiels archivés après le référentiel actif après bascule', () => {
    expect(
      toVisibleLinks({
        cae: { display: true, mode: 'archived' },
        eci: { display: true, mode: 'archived' },
        te: {
          display: true,
          mode: 'write',
          populatedFromCaeEci: {
            populatedAt: '2026-06-01T00:00:00.000Z',
            populatedBy: 'user-id',
          },
        },
      })
    ).toEqual(['edl-te', 'edl-cae', 'edl-eci', 'edl-demarche-pcaet']);
  });

  it('n’affiche pas un référentiel archivé masqué', () => {
    expect(
      toVisibleLinks(
        {
          cae: { display: false, mode: 'archived' },
          eci: { display: true, mode: 'archived' },
          te: { display: true, mode: 'write' },
        },
        false
      )
    ).toEqual(['edl-te', 'edl-eci']);
  });
});
