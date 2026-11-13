import { CreatePlanAggregateService } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { describe, expect, it, vi } from 'vitest';
import { ImportPlanInput } from './import-plan.input';
import { ImportPlanService } from './import-plan.service';
import {
  ResolvedFicheEntities,
  ResolveEntityService,
} from './resolvers/resolve-entity.service';
import { ImportActionInput } from './schemas/import-action.input';

const planInput: ImportPlanInput = {
  nom: 'Plan importé',
  actions: [{ axisPath: ['Axe 1'], titre: 'Action 1' } as ImportActionInput],
};

const resolved: ResolvedFicheEntities = {
  titre: 'Action 1',
  axisPath: ['Axe 1'],
  pilotes: [],
  referents: [],
  structures: [],
  services: [],
  financeurs: [],
  partenaires: [],
  instanceGouvernance: [],
};

const serviceFailingWith = (error: string, cause: Error) =>
  new ImportPlanService(
    {
      resolveFicheEntities: vi.fn(async () => success([resolved])),
    } as unknown as ResolveEntityService,
    {
      executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
    } as unknown as TransactionManager,
    {
      create: vi.fn(async () => failure(error, cause)),
    } as unknown as CreatePlanAggregateService
  );

const save = (service: ImportPlanService) =>
  service.save({ planInput, collectiviteId: 1, user: {} as AuthenticatedUser });

describe('ImportPlanService', () => {
  it("garde la cause Postgres d'une création en échec hors du message montré à l'utilisateur", async () => {
    const pgError = new Error('value too long for type character varying(255)');

    const result = await save(serviceFailingWith('DATABASE_ERROR', pgError));

    expect(result).toMatchObject({ success: false, cause: pgError });
    if (!result.success) {
      expect(result.error.message).toBe(
        'Erreur lors de la création du plan : DATABASE_ERROR'
      );
    }
  });

  it("cite le détail d'une validation en échec", async () => {
    const result = await save(
      serviceFailingWith(
        'INVALID_DATA',
        new Error("Titres d'actions en doublon dans le même axe : Axe 1::A")
      )
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe(
        "Erreur lors de la création du plan : Titres d'actions en doublon dans le même axe : Axe 1::A"
      );
    }
  });
});
