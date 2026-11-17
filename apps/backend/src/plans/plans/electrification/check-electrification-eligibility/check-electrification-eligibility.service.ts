import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationLaureatsConfig } from '@tet/domain/plans';
import { PlatformRole, ResourceType } from '@tet/domain/users';
import z from 'zod';
import { CheckElectrificationEligibilityError } from './check-electrification-eligibility.errors';
import { ElectrificationDataService } from '../publish-electrification-data/electrification-data.service';
import { ElectrificationLaureatsRules } from '../publish-electrification-data/electrification-laureats.rules';

const inputSchema = z.strictObject({ collectiviteId: z.int().positive() });

export type ElectrificationEligibilityDecision = {
  eligible: boolean;
  laureatReference: string | null;
  provenance: (
    | Pick<
        ElectrificationLaureatsConfig,
        'source' | 'version' | 'validFrom' | 'validUntil'
      >
    | { role: typeof PlatformRole.SUPER_ADMIN }
  ) & { checkedAt: string };
};

/** Vérification métier uniquement ; ne sélectionne pas le groupe de déploiement. */
@Injectable()
export class CheckElectrificationEligibilityService {
  constructor(
    private readonly data: ElectrificationDataService,
    private readonly permissions: PermissionService
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
      // Une absence de publication autorise la recette, pas une liste corrompue
      // ou une panne de stockage. Aucun rattachement lauréat n'est inventé.
      if (
        config.error === 'DATA_UNAVAILABLE' &&
        (await this.permissions.hasSuperAdminRole(user, tx))
      ) {
        return success({
          eligible: true,
          laureatReference: null,
          provenance: {
            role: PlatformRole.SUPER_ADMIN,
            checkedAt: new Date(Date.now()).toISOString(),
          },
        });
      }
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
        laureat !== undefined ||
        (await this.permissions.hasSuperAdminRole(user, tx)),
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
}
