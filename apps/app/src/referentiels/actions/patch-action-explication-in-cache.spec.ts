import { Action, ListActionsGroupedByIdResult } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { patchActionExplicationInCache } from './patch-action-explication-in-cache';

const buildAction = (actionId: string, explication: string | null) =>
  ({
    actionId,
    score: { actionId, explication },
  } as unknown as Action);

const buildCache = (): ListActionsGroupedByIdResult => ({
  actionsById: {
    'cae_1.1.1': buildAction('cae_1.1.1', 'ancien commentaire'),
    'cae_1.1.2': buildAction('cae_1.1.2', null),
  },
  hiddenActions: [{ actionId: 'cae_1.2', identifiant: '1.2', nom: 'Masquée' }],
});

describe('patchActionExplicationInCache', () => {
  it("met à jour l'explication de l'action ciblée", () => {
    const old = buildCache();

    const patched = patchActionExplicationInCache(
      old,
      'cae_1.1.1',
      'nouveau commentaire'
    );

    expect(patched?.actionsById['cae_1.1.1'].score.explication).toBe(
      'nouveau commentaire'
    );
  });

  it('ne modifie ni les autres actions ni les actions masquées', () => {
    const old = buildCache();

    const patched = patchActionExplicationInCache(
      old,
      'cae_1.1.1',
      'nouveau commentaire'
    );

    expect(patched?.actionsById['cae_1.1.2']).toBe(
      old.actionsById['cae_1.1.2']
    );
    expect(patched?.hiddenActions).toBe(old.hiddenActions);
  });

  it("ne mute pas le cache d'origine", () => {
    const old = buildCache();

    patchActionExplicationInCache(old, 'cae_1.1.1', 'nouveau commentaire');

    expect(old.actionsById['cae_1.1.1'].score.explication).toBe(
      'ancien commentaire'
    );
  });

  it("renvoie le cache inchangé si l'action n'y figure pas", () => {
    const old = buildCache();

    expect(patchActionExplicationInCache(old, 'cae_9.9.9', 'x')).toBe(old);
  });

  it('renvoie undefined si le cache est vide', () => {
    expect(
      patchActionExplicationInCache(undefined, 'cae_1.1.1', 'x')
    ).toBeUndefined();
  });
});
