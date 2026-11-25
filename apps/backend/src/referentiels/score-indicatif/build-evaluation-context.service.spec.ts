import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import ValeursReferenceService from '@tet/backend/indicateurs/valeurs/get-valeurs-reference/valeurs-reference.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { BuildEvaluationContextService } from './build-evaluation-context.service';
import { ScoreIndicatifRepository } from './score-indicatif.repository';

const collectiviteId = 3;
const collectiviteWithType = { id: collectiviteId } as CollectiviteAvecType;

const toServiceWithMocks = ({
  getValeursReference,
}: {
  getValeursReference: ReturnType<typeof vi.fn>;
}) =>
  new BuildEvaluationContextService(
    {
      getReferentielDefinition: vi.fn().mockResolvedValue({ version: '1.0.0' }),
    } as unknown as GetReferentielDefinitionService,
    {
      getPersonnalisationReponses: vi.fn().mockResolvedValue({}),
    } as unknown as PersonnalisationsService,
    { getValeursReference } as unknown as ValeursReferenceService,
    {
      getValeursProgression: vi.fn().mockResolvedValue(success([])),
    } as unknown as ScoreIndicatifRepository
  );

const buildContext = (service: BuildEvaluationContextService) =>
  service.buildEvaluationContext(
    { collectiviteId } as Parameters<
      BuildEvaluationContextService['buildEvaluationContext']
    >[0],
    [],
    {},
    [],
    collectiviteWithType,
    {}
  );

describe('BuildEvaluationContextService.buildEvaluationContext', () => {
  it('convertit un échec des valeurs de référence en VALEURS_REFERENCE_ERROR avec sa cause', async () => {
    const cause = new Error('lecture impossible');

    const result = await buildContext(
      toServiceWithMocks({
        getValeursReference: vi
          .fn()
          .mockResolvedValue(failure('DATABASE_ERROR', cause)),
      })
    );

    expect(result).toEqual(failure('VALEURS_REFERENCE_ERROR', cause));
  });

  it('retourne le contexte quand les valeurs de référence sont lues', async () => {
    const result = await buildContext(
      toServiceWithMocks({
        getValeursReference: vi.fn().mockResolvedValue(success([])),
      })
    );

    expect(result).toMatchObject({ success: true });
  });
});
