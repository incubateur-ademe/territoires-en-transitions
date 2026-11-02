import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { FindUserService } from '../find-user/find-user.service';
import { PosthogQueryClient } from '../run-hogql-query/posthog-query.client';

const MAX_EVENTS = 50;

export const listRecentEventsInputSchema = z.object({
  email: z
    .string()
    .email()
    .describe("Adresse e-mail de l'utilisateur dont on veut le parcours"),
  jours: z
    .number()
    .int()
    .min(1)
    .max(90)
    .default(30)
    .describe('Période en jours (30 par défaut, 90 au plus)'),
});
export type ListRecentEventsInput = z.infer<typeof listRecentEventsInputSchema>;

export const listRecentEventsOutputSchema = z.object({
  periodeJours: z.number(),
  evenements: z.array(
    z.object({
      horodatage: z.string(),
      evenement: z.string(),
      page: z.string().nullable(),
      collectiviteId: z.string().nullable(),
    })
  ),
  note: z.string(),
});
export type ListRecentEventsOutput = z.infer<
  typeof listRecentEventsOutputSchema
>;

type ListRecentEventsError =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'POSTHOG_NOT_CONFIGURED'
  | 'POSTHOG_QUERY_ERROR';

/** Échappe une chaîne pour un littéral HogQL entre apostrophes. */
export function toHogqlString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function buildRecentEventsHogql(email: string, jours: number): string {
  return `SELECT timestamp, event, properties.$pathname AS page, properties.collectivite_id AS collectivite_id
FROM events
WHERE lower(person.properties.email) = ${toHogqlString(
    email.trim().toLowerCase()
  )}
  AND timestamp >= now() - INTERVAL ${Math.floor(jours)} DAY
  AND properties.$current_url ILIKE '%territoiresentransitions.fr%'
ORDER BY timestamp DESC
LIMIT ${MAX_EVENTS}`;
}

/**
 * Derniers événements PostHog d'une personne, pour comprendre un blocage.
 * Même règle d'accès que `find_user` ; la requête est construite côté serveur,
 * le modèle ne fournit que l'e-mail et la période.
 */
@Injectable()
export class ListRecentEventsService {
  private readonly logger = new Logger(ListRecentEventsService.name);

  constructor(
    private readonly findUserService: FindUserService,
    private readonly posthogQueryClient: PosthogQueryClient
  ) {}

  async run(
    input: ListRecentEventsInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListRecentEventsOutput, ListRecentEventsError>> {
    const readable = await this.findUserService.findReadable(input.email, {
      user,
    });
    if (!readable.success) {
      return readable;
    }
    if (!this.posthogQueryClient.isConfigured()) {
      return failure('POSTHOG_NOT_CONFIGURED');
    }

    this.logger.log(`list_recent_events (${input.jours} jours)`);
    const result = await this.posthogQueryClient.run(
      buildRecentEventsHogql(input.email, input.jours)
    );
    if (!result.success) {
      return result;
    }

    const index = (name: string) => result.data.columns.indexOf(name);
    const [iTimestamp, iEvent, iPage, iCollectivite] = [
      index('timestamp'),
      index('event'),
      index('page'),
      index('collectivite_id'),
    ];
    const asText = (value: unknown) =>
      value === null || value === undefined || value === ''
        ? null
        : String(value);

    return success({
      periodeJours: input.jours,
      evenements: result.data.results.map((row) => ({
        horodatage: String(row[iTimestamp]),
        evenement: String(row[iEvent]),
        page: asText(row[iPage]),
        collectiviteId: asText(row[iCollectivite]),
      })),
      note: `${MAX_EVENTS} derniers événements au plus. Les visites bloquées par un bloqueur de publicité n'apparaissent pas.`,
    });
  }
}
