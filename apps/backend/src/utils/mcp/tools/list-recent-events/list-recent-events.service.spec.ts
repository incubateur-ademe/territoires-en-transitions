import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { FindUserService } from '../find-user/find-user.service';
import { PosthogQueryClient } from '../run-hogql-query/posthog-query.client';
import {
  buildRecentEventsHogql,
  ListRecentEventsService,
  toHogqlString,
} from './list-recent-events.service';

const user = { id: 'appelant' } as AuthenticatedUser;

describe('buildRecentEventsHogql', () => {
  test("échappe l'e-mail et borne la période et le nombre de lignes", () => {
    const hogql = buildRecentEventsHogql("O'Neil@Ville.FR ", 30);

    expect(hogql).toContain(`= ${toHogqlString("o'neil@ville.fr")}`);
    expect(hogql).toContain("'o\\'neil@ville.fr'");
    expect(hogql).toContain('INTERVAL 30 DAY');
    expect(hogql).toContain('LIMIT 50');
  });

  test('un e-mail piégé reste un littéral', () => {
    const hogql = buildRecentEventsHogql("x@y.fr' OR 1=1 --", 7);

    expect(hogql).toContain("'x@y.fr\\' or 1=1 --'");
  });
});

describe('ListRecentEventsService', () => {
  const build = ({ readable }: { readable: boolean }) => {
    const findUserService = {
      findReadable: vi.fn(async () =>
        readable ? success({ user: {}, readable: [] }) : failure('UNAUTHORIZED')
      ),
    } as unknown as FindUserService;
    const posthog = {
      isConfigured: () => true,
      run: vi.fn(async () =>
        success({
          columns: ['timestamp', 'event', 'page', 'collectivite_id'],
          results: [
            [
              '2026-10-27T10:00:00Z',
              '$pageview',
              '/collectivite/12/pcaet',
              '12',
            ],
            ['2026-10-27T09:59:00Z', 'upload_failed', null, ''],
          ],
          hasMore: false,
        })
      ),
    } as unknown as PosthogQueryClient;
    return {
      service: new ListRecentEventsService(findUserService, posthog),
      posthog,
    };
  };

  test('renvoie les événements quand la personne est lisible', async () => {
    const { service } = build({ readable: true });

    const result = await service.run(
      { email: 'agent@ville.fr', jours: 30 },
      { user }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        periodeJours: 30,
        evenements: [
          {
            evenement: '$pageview',
            page: '/collectivite/12/pcaet',
            collectiviteId: '12',
          },
          { evenement: 'upload_failed', page: null, collectiviteId: null },
        ],
      },
    });
  });

  test("n'interroge pas PostHog sans droit sur la personne", async () => {
    const { service, posthog } = build({ readable: false });

    const result = await service.run(
      { email: 'agent@ville.fr', jours: 30 },
      { user }
    );

    expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(posthog.run).not.toHaveBeenCalled();
  });
});
