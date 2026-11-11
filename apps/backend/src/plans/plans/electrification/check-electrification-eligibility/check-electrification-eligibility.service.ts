import { Injectable } from '@nestjs/common';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationLaureatsConfig } from '@tet/domain/plans';
import { hasRole, PlatformRole, ResourceType } from '@tet/domain/users';
import z from 'zod';
import { CheckElectrificationEligibilityError } from './check-electrification-eligibility.errors';
import { ElectrificationDataService } from '../publish-electrification-data/electrification-data.service';
import { ElectrificationLaureatsRules } from '../publish-electrification-data/electrification-laureats.rules';

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
    private readonly data: ElectrificationDataService,
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

    // La publication manquante ne bloque ni le démarrage ni l'import générique.
    const config = await this.data.getLaureats();
    if (!config.success) {
      return failure(
        config.error === 'INVALID_DATA'
          ? 'INVALID_ELECTRIFICATION_LAUREATS_CONFIG'
          : 'ELECTRIFICATION_LAUREATS_UNAVAILABLE'
      );
    }
    const invalid = ElectrificationLaureatsRules.validate(config.data);
    if (invalid) return failure(invalid);
    const { source, version, validFrom, validUntil, laureats } = config.data;
    const from = Date.parse(validFrom);
    const until = validUntil === null ? null : Date.parse(validUntil);
    const checkedAt = Date.now();
    // Début inclus, fin exclue lorsqu'elle est définie.
    if (checkedAt < from || (until !== null && checkedAt >= until)) {
      return failure('INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG');
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
