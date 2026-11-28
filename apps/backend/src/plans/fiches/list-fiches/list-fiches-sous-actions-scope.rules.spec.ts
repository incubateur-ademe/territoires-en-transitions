import {
  isSousActionsMatchingEnabled,
  splitFiltersBySousActionScope,
} from './list-fiches-sous-actions-scope.rules';

describe('splitFiltersBySousActionScope', () => {
  test('les filtres sur les champs d’une sous-action lui sont appliqués', () => {
    const { actionFilters, sousActionFieldFilters } =
      splitFiltersBySousActionScope({
        statuts: ['En cours'],
        noStatut: true,
        utilisateurPiloteIds: ['u1'],
        personnePiloteIds: [1],
        noPilote: true,
        texteNomOuDescription: 'vélo',
        noTitre: false,
        noDescription: true,
        hasDateDeFinPrevisionnelle: true,
      });

    expect(actionFilters).toEqual({});
    expect(sousActionFieldFilters).toEqual({
      statuts: ['En cours'],
      noStatut: true,
      utilisateurPiloteIds: ['u1'],
      personnePiloteIds: [1],
      noPilote: true,
      texteNomOuDescription: 'vélo',
      noTitre: false,
      noDescription: true,
      hasDateDeFinPrevisionnelle: true,
    });
  });

  test('les autres filtres et le périmètre restent sur l’action', () => {
    const { actionFilters, sousActionFieldFilters } =
      splitFiltersBySousActionScope({
        thematiqueIds: [1],
        priorites: ['Élevé'],
        noTag: true,
        planActionIds: [3],
        restreint: false,
        modifiedSince: 'last-90-days',
        statuts: ['À venir'],
        withSousActionsMatches: true,
      });

    expect(actionFilters).toEqual({
      thematiqueIds: [1],
      priorites: ['Élevé'],
      noTag: true,
      planActionIds: [3],
      restreint: false,
      modifiedSince: 'last-90-days',
    });
    expect(sousActionFieldFilters).toEqual({ statuts: ['À venir'] });
  });

  test('une période sur la date de fin s’applique à la sous-action', () => {
    const periode = {
      typePeriode: 'fin',
      debutPeriode: '2026-01-01',
      finPeriode: '2026-12-31',
    } as const;

    const { actionFilters, sousActionFieldFilters } =
      splitFiltersBySousActionScope(periode);

    expect(actionFilters).toEqual({});
    expect(sousActionFieldFilters).toEqual(periode);
  });

  test.each(['debut', 'creation', 'modification', undefined] as const)(
    'une période de type %s reste sur l’action',
    (typePeriode) => {
      const periode = {
        typePeriode,
        debutPeriode: '2026-01-01',
        finPeriode: '2026-12-31',
      };

      const { actionFilters, sousActionFieldFilters } =
        splitFiltersBySousActionScope(periode);

      expect(actionFilters).toEqual(periode);
      expect(sousActionFieldFilters).toEqual({});
    }
  );
});

describe('isSousActionsMatchingEnabled', () => {
  test('actif sur une liste d’actions', () => {
    expect(isSousActionsMatchingEnabled({ withSousActionsMatches: true })).toBe(
      true
    );
    expect(isSousActionsMatchingEnabled({})).toBe(false);
  });

  test('sans effet quand les lignes listées sont des sous-actions', () => {
    expect(
      isSousActionsMatchingEnabled({
        withSousActionsMatches: true,
        onlyChildren: true,
      })
    ).toBe(false);
    expect(
      isSousActionsMatchingEnabled({
        withSousActionsMatches: true,
        parentsId: [1],
      })
    ).toBe(false);
  });
});
