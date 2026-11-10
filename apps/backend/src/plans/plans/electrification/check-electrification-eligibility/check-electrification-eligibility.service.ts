import { Inject, Injectable } from '@nestjs/common';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationLaureatsConfig,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { hasRole, PlatformRole, ResourceType } from '@tet/domain/users';
import z from 'zod';
import { CheckElectrificationEligibilityError } from './check-electrification-eligibility.errors';
import { ELECTRIFICATION_LAUREATS_CONFIG } from '../config/electrification-eligibility.constants';

const inputSchema = z.strictObject({ collectiviteId: z.int().positive() });

export type ElectrificationEligibilityDecision = {
  eligible: boolean;
  laureatReference: string | null;
  provenance: Pick<
    ElectrificationLaureatsConfig,
    'source' | 'version' | 'validFrom' | 'validUntil'
  > & { checkedAt: string };
};

/** Vérification métier uniquement ; ne sélectionne pas le groupe de déploiement. */
@Injectable()
export class CheckElectrificationEligibilityService {
  constructor(
    @Inject(ELECTRIFICATION_LAUREATS_CONFIG)
    private readonly config: unknown,
    private readonly permissions: PermissionService,
    private readonly roles: GetUserRolesAndPermissionsService
  ) {}

  async check(
    input: z.infer<typeof inputSchema>,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      ElectrificationEligibilityDecision,
      CheckElectrificationEligibilityError
    >
  > {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return failure('INVALID_ELIGIBILITY_INPUT');

    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: parsed.data.collectiviteId },
      tx
    );
    if (!permission.success) return failure('UNAUTHORIZED');

    // La configuration manquante ne bloque ni le démarrage ni l'import générique.
    if (this.config == null) {
      return failure('ELECTRIFICATION_LAUREATS_UNAVAILABLE');
    }
    const config = electrificationLaureatsConfigSchema.safeParse(this.config);
    if (!config.success) {
      return failure('INVALID_ELECTRIFICATION_LAUREATS_CONFIG');
    }
    const { source, version, validFrom, validUntil, laureats } = config.data;
    const from = Date.parse(validFrom);
    const until = validUntil === null ? null : Date.parse(validUntil);
    if (until !== null && from >= until) {
      return failure('INVALID_ELECTRIFICATION_LAUREATS_CONFIG');
    }
    const checkedAt = Date.now();
    // Début inclus, fin exclue lorsqu'elle est définie.
    if (checkedAt < from || (until !== null && checkedAt >= until)) {
      return failure('INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG');
    }
    if (
      new Set(laureats.map(({ reference }) => reference)).size !==
        laureats.length ||
      new Set(laureats.map(({ collectiviteId }) => collectiviteId)).size !==
        laureats.length
    ) {
      return failure('AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG');
    }

    const laureat = laureats.find(
      ({ collectiviteId }) => collectiviteId === parsed.data.collectiviteId
    );
    return success({
      eligible:
        laureat !== undefined || (await this.canImportNonLaureat({ user, tx })),
      laureatReference: laureat?.reference ?? null,
      provenance: {
        source,
        version,
        validFrom,
        validUntil,
        checkedAt: new Date(checkedAt).toISOString(),
      },
    });
  }
  /** Exception de recette : ne transforme pas la collectivité en lauréate. */
  private async canImportNonLaureat({ user, tx }: ServiceSecondArg) {
    if (
      user.jwtPayload.client_id !== undefined ||
      user.jwtPayload.permissions !== undefined
    ) {
      return false;
    }
    const roles = await this.roles.getUserRolesAndPermissions({
      userId: user.id,
      tx,
    });
    return roles.success && hasRole(roles.data, PlatformRole.SUPER_ADMIN);
  }
}
