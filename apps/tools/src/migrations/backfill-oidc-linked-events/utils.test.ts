import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_CREATION_THRESHOLD_MS,
  buildBackfillPlan,
  ExportedIdentity,
  OIDC_LINKED_EVENT,
} from './utils';

const COMPTE_CREE_LE = '2026-01-10T09:00:00.000Z';

const identity = (
  overrides: Partial<ExportedIdentity> = {}
): ExportedIdentity => ({
  user_id: '11111111-1111-1111-1111-111111111111',
  provider: 'proconnect',
  identite_creee_le: '2026-07-24T14:30:00.000Z',
  compte_cree_le: COMPTE_CREE_LE,
  ...overrides,
});

describe('buildBackfillPlan', () => {
  it('reconstruit un évènement antidaté par identité liée', () => {
    const { events, skipped } = buildBackfillPlan([identity()]);

    expect(skipped).toHaveLength(0);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      distinctId: '11111111-1111-1111-1111-111111111111',
      event: OIDC_LINKED_EVENT,
      properties: {
        provider: 'proconnect',
        backfill: true,
        backfill_source: 'utilisateur_identite_oidc',
      },
    });
    // La date de l'évènement est celle de la liaison, pas celle du run.
    expect(events[0].timestamp.toISOString()).toBe('2026-07-24T14:30:00.000Z');
  });

  it("n'invente pas d'origine (inconnue pour l'historique)", () => {
    const { events } = buildBackfillPlan([identity()]);

    expect(events[0].properties).not.toHaveProperty('origine');
  });

  // La garantie de rejouabilité : PostHog déduplique sur
  // uuid + nom + timestamp + distinct_id.
  it('donne un uuid déterministe, stable entre deux passages', () => {
    const [premier] = buildBackfillPlan([identity()]).events;
    const [second] = buildBackfillPlan([identity()]).events;

    expect(premier.uuid).toBe(second.uuid);
  });

  it('donne des uuid distincts par identité', () => {
    const { events } = buildBackfillPlan([
      identity(),
      identity({ user_id: '22222222-2222-2222-2222-222222222222' }),
      identity({ provider: 'moncompteademe' }),
    ]);

    expect(new Set(events.map((event) => event.uuid)).size).toBe(3);
  });

  // Le backend n'émet pas l'évènement pour `creation-compte` : le backfill
  // doit exclure les mêmes lignes, sinon la métrique change de sens à la
  // date de la bascule.
  it('écarte les identités nées avec leur compte', () => {
    const { events, skipped } = buildBackfillPlan([
      identity({ identite_creee_le: COMPTE_CREE_LE }),
    ]);

    expect(events).toHaveLength(0);
    expect(skipped).toEqual([
      { identity: expect.anything(), reason: 'creation-compte' },
    ]);
  });

  it('garde une liaison juste au-delà du seuil de création', () => {
    const justeApres = new Date(
      new Date(COMPTE_CREE_LE).getTime() + ACCOUNT_CREATION_THRESHOLD_MS + 1000
    ).toISOString();

    const { events } = buildBackfillPlan([
      identity({ identite_creee_le: justeApres }),
    ]);

    expect(events).toHaveLength(1);
  });

  it('écarte les lignes inexploitables sans faire échouer le lot', () => {
    const { events, skipped } = buildBackfillPlan([
      identity({ provider: 'un-provider-inconnu' }),
      identity({ identite_creee_le: 'pas-une-date' }),
      identity({ user_id: '' }),
      identity({ user_id: '33333333-3333-3333-3333-333333333333' }),
    ]);

    expect(events).toHaveLength(1);
    expect(skipped.map((entry) => entry.reason)).toEqual([
      'ligne-invalide',
      'ligne-invalide',
      'ligne-invalide',
    ]);
  });
});
