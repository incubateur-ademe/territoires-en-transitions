import { ForbiddenException } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import {
  Indicateur,
  INDICATEUR_SOURCES_WITH_DEDICATED_METADATA,
  IndicateurPeriodiciteEnum,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { ValidateIndicateurValeursWriteService } from './validate-indicateur-valeurs-write.service';

const collectiviteId = 10;
const otherCollectiviteId = 11;
const groupementId = 7;
const metadonneeId = 5;
const dedicatedMetadataSourceId = INDICATEUR_SOURCES_WITH_DEDICATED_METADATA[0];
const tx = {} as Transaction;
const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');

const indicateurPerso = {
  id: 1,
  collectiviteId,
  identifiantReferentiel: null,
  groupementId: null,
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  sansValeurUtilisateur: false,
} as unknown as Indicateur;

const indicateurDeGroupement = {
  ...indicateurPerso,
  collectiviteId: null,
  groupementId,
} as unknown as Indicateur;

const indicateurSansValeurUtilisateur = {
  ...indicateurPerso,
  sansValeurUtilisateur: true,
} as unknown as Indicateur;

const toValeur = (
  overrides: Partial<IndicateurValeurCreate> = {}
): IndicateurValeurCreate =>
  ({
    indicateurId: indicateurPerso.id,
    collectiviteId,
    dateValeur: '2024-01-01',
    resultat: 1,
    ...overrides,
  } as IndicateurValeurCreate);

const toValidationServiceWithMocks = ({
  indicateurs,
  metadataSources = [],
  memberships = [],
  assertAllowed = vi.fn().mockResolvedValue(undefined),
}: {
  indicateurs: Indicateur[];
  metadataSources?: { id: number; sourceId: string }[];
  memberships?: { groupementId: number; collectiviteId: number }[];
  assertAllowed?: ReturnType<typeof vi.fn>;
}): ValidateIndicateurValeursWriteService => {
  const repository = {
    listMetadataSources: vi.fn().mockResolvedValue(metadataSources),
    lockGroupementMemberships: vi.fn().mockResolvedValue(memberships),
  } as unknown as IndicateurValeursRepository;
  const permissionService = {
    assertAllowed,
  } as unknown as PermissionService;
  const indicateurLockRepository = {
    lockIndicateurs: vi.fn().mockResolvedValue(success(indicateurs)),
  } as unknown as IndicateurLockRepository;
  return new ValidateIndicateurValeursWriteService(
    repository,
    permissionService,
    indicateurLockRepository
  );
};

describe('ValidateIndicateurValeursWriteService', () => {
  describe('prepare', () => {
    it("refuse l'écriture sans utilisateur ni capacité interne explicite", async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [],
      }).prepare([toValeur()], { isUserTrusted: false } as never);

      expect(result).toMatchObject({
        success: false,
        error: 'UNAUTHORIZED',
        cause: {
          message:
            'Un contexte utilisateur ou une capacité interne explicite est requis pour écrire des valeurs',
        },
      });
    });

    it('accepte une capacité interne explicite sans vérifier de permission ni estampiller les valeurs', async () => {
      const assertAllowed = vi.fn();
      const valeur = toValeur();

      const result = await toValidationServiceWithMocks({
        indicateurs: [],
        assertAllowed,
      }).prepare([valeur], { isUserTrusted: true });

      expect(result).toEqual(success({ valeurs: [valeur] }));
      expect(assertAllowed).not.toHaveBeenCalled();
    });

    it("vérifie la permission une fois par collectivité et estampille les valeurs avec l'utilisateur", async () => {
      const assertAllowed = vi.fn().mockResolvedValue(undefined);

      const result = await toValidationServiceWithMocks({
        indicateurs: [],
        assertAllowed,
      }).prepare(
        [
          toValeur(),
          toValeur({ dateValeur: '2025-01-01' }),
          toValeur({ collectiviteId: otherCollectiviteId }),
        ],
        { user, tx }
      );

      expect(assertAllowed).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        success: true,
        data: {
          valeurs: [
            { createdBy: user.id, modifiedBy: user.id, calculAuto: false },
            { createdBy: user.id, modifiedBy: user.id, calculAuto: false },
            { createdBy: user.id, modifiedBy: user.id, calculAuto: false },
          ],
        },
      });
    });

    it("retourne UNAUTHORIZED quand la permission est refusée pour l'utilisateur", async () => {
      const refusal = new ForbiddenException('Permission refusée');

      const result = await toValidationServiceWithMocks({
        indicateurs: [],
        assertAllowed: vi.fn().mockRejectedValue(refusal),
      }).prepare([toValeur()], { user, tx });

      expect(result).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: refusal,
      });
    });
  });

  describe('validate', () => {
    it("refuse une valeur dont l'indicateur est introuvable", async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [],
      }).validate({ valeurs: [toValeur({ indicateurId: 99 })] }, { user, tx });

      expect(result).toMatchObject({
        success: false,
        error: 'INVALID_VALUE',
        cause: { message: 'Indicateur definition not found for id 99' },
      });
    });

    it("refuse une valeur sur l'indicateur personnalisé d'une autre collectivité", async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurPerso],
      }).validate(
        { valeurs: [toValeur({ collectiviteId: otherCollectiviteId })] },
        { user, tx }
      );

      expect(result).toMatchObject({
        success: false,
        error: 'INVALID_VALUE',
        cause: {
          message: `Indicateur 1 non disponible pour la collectivité ${otherCollectiviteId}`,
        },
      });
    });

    it("refuse une valeur sur l'indicateur d'un groupement dont la collectivité n'est pas membre", async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurDeGroupement],
        memberships: [],
      }).validate({ valeurs: [toValeur()] }, { user, tx });

      expect(result).toMatchObject({
        success: false,
        error: 'INVALID_VALUE',
        cause: {
          message: `Indicateur 1 non disponible pour la collectivité ${collectiviteId}`,
        },
      });
    });

    it("accepte une valeur sur l'indicateur d'un groupement dont la collectivité est membre", async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurDeGroupement],
        memberships: [{ groupementId, collectiviteId }],
      }).validate({ valeurs: [toValeur()] }, { user, tx });

      expect(result).toEqual(
        success({ [indicateurDeGroupement.id]: indicateurDeGroupement })
      );
    });

    it('refuse une valeur dont la périodicité diffère de celle de l’indicateur', async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurPerso],
      }).validate(
        {
          valeurs: [
            toValeur({ periodicite: IndicateurPeriodiciteEnum.TRIMESTRIELLE }),
          ],
        },
        { user, tx }
      );

      expect(result).toMatchObject({
        success: false,
        error: 'INVALID_VALUE',
        cause: {
          message: 'La valeur doit respecter la périodicité de déclaration',
        },
      });
    });

    it('refuse une valeur sous une métadonnée dédiée sans autorisation interne', async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurPerso],
        metadataSources: [
          { id: metadonneeId, sourceId: dedicatedMetadataSourceId },
        ],
      }).validate({ valeurs: [toValeur({ metadonneeId })] }, { user, tx });

      expect(result).toMatchObject({
        success: false,
        error: 'UNAUTHORIZED',
        cause: {
          message:
            "L'écriture sous une métadonnée nécessite une autorisation interne dédiée",
        },
      });
    });

    it('accepte une valeur sous une métadonnée dédiée avec son autorisation interne exacte', async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurPerso],
        metadataSources: [
          { id: metadonneeId, sourceId: dedicatedMetadataSourceId },
        ],
      }).validate(
        { valeurs: [toValeur({ metadonneeId })] },
        {
          user,
          tx,
          metadataAuthorization: {
            collectiviteId,
            metadonneeId,
            sourceId: dedicatedMetadataSourceId,
          },
        }
      );

      expect(result).toEqual(
        success({ [indicateurPerso.id]: indicateurPerso })
      );
    });

    it('refuse une valeur utilisateur sur un indicateur alimenté uniquement par calcul ou source', async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurSansValeurUtilisateur],
      }).validate({ valeurs: [toValeur()] }, { user, tx });

      expect(result).toMatchObject({
        success: false,
        error: 'USER_VALUE_NOT_ALLOWED',
      });
    });

    it('retourne les indicateurs verrouillés quand toutes les valeurs sont valides', async () => {
      const result = await toValidationServiceWithMocks({
        indicateurs: [indicateurPerso],
      }).validate({ valeurs: [toValeur()] }, { user, tx });

      expect(result).toEqual(
        success({ [indicateurPerso.id]: indicateurPerso })
      );
    });
  });
});
