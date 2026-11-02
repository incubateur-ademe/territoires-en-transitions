import { Injectable } from '@nestjs/common';
import ListCollectivitesService from '@tet/backend/collectivites/list-collectivites/list-collectivites.service';
import { ListPlansService } from '@tet/backend/plans/plans/list-plans/list-plans.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { FindUserRepository } from '../find-user/find-user.repository';
import {
  CollectiviteAccessError,
  CollectiviteAccessService,
} from '../shared/collectivite-access.service';

export const getCollectiviteInputSchema = z
  .object({
    collectiviteId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Identifiant TeT de la collectivité'),
    siren: z
      .string()
      .regex(/^\d{9}$/)
      .optional()
      .describe('SIREN de la collectivité (9 chiffres)'),
  })
  .refine((input) => input.collectiviteId || input.siren, {
    message: 'collectiviteId ou siren est requis',
  });
export type GetCollectiviteInput = z.infer<typeof getCollectiviteInputSchema>;

export const getCollectiviteOutputSchema = z.object({
  collectiviteId: z.number(),
  nom: z.string(),
  type: z.string(),
  natureInsee: z.string().nullable(),
  siren: z.string().nullable(),
  communeCode: z.string().nullable(),
  region: z.string().nullable(),
  departement: z.string().nullable(),
  population: z.number().nullable(),
  cotActif: z.boolean(),
  accesRestreint: z.boolean(),
  membresActifs: z.number(),
  plans: z.number().describe('Plans d’action actifs ou à vérifier'),
  creeeLe: z.string().nullable(),
});
export type GetCollectiviteOutput = z.infer<typeof getCollectiviteOutputSchema>;

@Injectable()
export class GetCollectiviteService {
  constructor(
    private readonly listCollectivitesService: ListCollectivitesService,
    private readonly listPlansService: ListPlansService,
    private readonly findUserRepository: FindUserRepository,
    private readonly collectiviteAccessService: CollectiviteAccessService
  ) {}

  async run(
    input: GetCollectiviteInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<GetCollectiviteOutput, CollectiviteAccessError>> {
    let collectivite: Record<string, unknown>;
    try {
      collectivite =
        (await this.listCollectivitesService.getCollectiviteByAnyIdentifiant({
          collectiviteId: input.collectiviteId,
          siren: input.siren,
          withRelations: false,
        })) as unknown as Record<string, unknown>;
    } catch {
      return failure('NOT_FOUND', new Error('Collectivité introuvable'));
    }
    const collectiviteId = Number(collectivite.id);

    const access = await this.collectiviteAccessService.assertAllowed(
      collectiviteId,
      {
        public: 'collectivites.read',
        confidentiel: 'collectivites.read_confidentiel',
      },
      user
    );
    if (!access.success) {
      return access;
    }

    const [membresActifs, plans] = await Promise.all([
      this.findUserRepository.countActiveMembers(collectiviteId),
      this.listPlansService.listPlans({ collectiviteId, limit: 1 }, { user }),
    ]);

    const text = (key: string) =>
      typeof collectivite[key] === 'string'
        ? (collectivite[key] as string)
        : null;

    return success({
      collectiviteId,
      nom: String(collectivite.nom),
      type: String(collectivite.type),
      natureInsee: text('natureInsee'),
      siren: text('siren'),
      communeCode: text('communeCode'),
      region: text('regionName'),
      departement: text('departementName'),
      population:
        typeof collectivite.population === 'number'
          ? collectivite.population
          : null,
      cotActif: Boolean(collectivite.activeCOT),
      accesRestreint: access.data.accesRestreint,
      membresActifs,
      plans: plans.success ? plans.data.totalCount : 0,
      creeeLe: text('createdAt'),
    });
  }
}
