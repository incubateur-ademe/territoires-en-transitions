import { describe, expect, it } from 'vitest';
import { toBackBreadcrumbItem } from './to-back-breadcrumb-item';

const collectiviteId = 1;
const actionsDeReference = {
  label: 'Actions de référence',
  href: '/collectivite/1/actions-reference',
};

describe('toBackBreadcrumbItem', () => {
  it('renvoie vers le catalogue sans origine', () => {
    expect(toBackBreadcrumbItem({ from: null, collectiviteId })).toEqual(
      actionsDeReference
    );
  });

  it('revient au catalogue en conservant ses filtres', () => {
    expect(
      toBackBreadcrumbItem({
        from: '/collectivite/1/actions-reference?searchedText=velo',
        collectiviteId,
      })
    ).toEqual({
      label: 'Actions de référence',
      href: '/collectivite/1/actions-reference?searchedText=velo',
    });
  });

  it("revient à l'aide à la priorisation", () => {
    expect(
      toBackBreadcrumbItem({
        from: '/collectivite/1/priorisation',
        collectiviteId,
      })
    ).toEqual({
      label: 'Aide à la priorisation',
      href: '/collectivite/1/priorisation',
    });
  });

  it('revient aux actions sauvegardées', () => {
    expect(
      toBackBreadcrumbItem({
        from: '/collectivite/1/priorisation/actions-preselectionnees',
        collectiviteId,
      })
    ).toEqual({
      label: 'Mes actions sauvegardées',
      href: '/collectivite/1/priorisation/actions-preselectionnees',
    });
  });

  it.each([
    ['une page inconnue', '/collectivite/1/plans'],
    ['la page d’une autre collectivité', '/collectivite/2/priorisation'],
    ['une URL externe', 'https://example.com/collectivite/1/priorisation'],
    ['une URL sans protocole', '//example.com/collectivite/1/priorisation'],
    ['un chemin à antislash', '/\\example.com/collectivite/1/priorisation'],
    ['un chemin à ancre', '/collectivite/1/priorisation#section'],
    ['un chemin à slash final', '/collectivite/1/priorisation/'],
  ])('renvoie vers le catalogue pour %s', (_name, from) => {
    expect(toBackBreadcrumbItem({ from, collectiviteId })).toEqual(
      actionsDeReference
    );
  });
});
