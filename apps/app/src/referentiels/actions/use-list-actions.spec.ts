import { describe, expect, it } from 'vitest';
import { ActionListItem, filterActions } from './use-list-actions';

const action = (
  overrides: Partial<ActionListItem> & Pick<ActionListItem, 'actionId'>
): ActionListItem =>
  ({
    actionType: 'action',
    pilotes: [],
    services: [],
    ...overrides,
  } as unknown as ActionListItem);

describe('filterActions', () => {
  const axe = action({ actionId: 'cae_1', actionType: 'axe' });
  const pilotedByUser = action({
    actionId: 'cae_1.1',
    pilotes: [{ userId: 'u1', tagId: null, nom: 'Alice', collectiviteId: 1 }],
  });
  const pilotedByTag = action({
    actionId: 'cae_1.2',
    pilotes: [{ userId: null, tagId: 42, nom: 'Equipe', collectiviteId: 1 }],
  });
  const withService = action({
    actionId: 'cae_1.3',
    services: [{ id: 7, nom: 'Direction', collectiviteId: 1 }],
  });
  const noPilote = action({ actionId: 'cae_1.4' });

  const all = [axe, pilotedByUser, pilotedByTag, withService, noPilote];

  it('returns everything when no filters are applied', () => {
    expect(filterActions(all, {})).toEqual(all);
  });

  it('filtre par utilisateurPiloteIds', () => {
    expect(
      filterActions(all, { utilisateurPiloteIds: ['u1'] })
    ).toEqual([pilotedByUser]);
  });

  it('filtre par personnePiloteIds', () => {
    expect(filterActions(all, { personnePiloteIds: [42] })).toEqual([
      pilotedByTag,
    ]);
  });

  it('filtre par servicePiloteIds', () => {
    expect(filterActions(all, { servicePiloteIds: [7] })).toEqual([
      withService,
    ]);
  });

  it("exclut les actions sans pilote quand un filtre pilote est appliqué", () => {
    const result = filterActions(all, { utilisateurPiloteIds: ['u1'] });
    expect(result).not.toContain(axe);
    expect(result).not.toContain(noPilote);
  });

  it('applique la sémantique AND entre plusieurs ids de pilote', () => {
    const piloteParDeux = action({
      actionId: 'cae_2.1',
      pilotes: [
        { userId: 'u1', tagId: null, nom: 'Alice', collectiviteId: 1 },
        { userId: 'u2', tagId: null, nom: 'Bob', collectiviteId: 1 },
      ],
    });
    const result = filterActions([pilotedByUser, piloteParDeux], {
      utilisateurPiloteIds: ['u1', 'u2'],
    });
    expect(result).toEqual([piloteParDeux]);
  });

  it('combine filtres pilote et actionTypes', () => {
    const result = filterActions(all, {
      actionTypes: ['action'],
      utilisateurPiloteIds: ['u1'],
    });
    expect(result).toEqual([pilotedByUser]);
  });
});
