import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { ListIndicateursPredefinisRepository } from '../../indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import ValeursReferenceService from './valeurs-reference.service';

const collectiviteId = 3;
const referentielContext = { referentielId: 'te' as const, version: '1.0.0' };
const options = { collectiviteId, indicateurIds: [1], referentielContext };

const indicateurWithCible = {
  id: 1,
  identifiantReferentiel: null,
  exprCible: '2',
  exprSeuil: null,
  libelleCibleSeuil: null,
  unite: '',
};

const toServiceWithMocks = ({
  collectivite = success({}),
  getCollectiviteAvecType = vi.fn().mockResolvedValue(collectivite),
  indicateurs = success([indicateurWithCible]),
  parseAndEvaluateExpression = vi.fn().mockReturnValue(2),
}: {
  collectivite?: unknown;
  getCollectiviteAvecType?: ReturnType<typeof vi.fn>;
  indicateurs?: unknown;
  parseAndEvaluateExpression?: ReturnType<typeof vi.fn>;
}) =>
  new ValeursReferenceService(
    {
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      },
    } as unknown as DatabaseService,
    { getCollectiviteAvecType } as unknown as CollectivitesService,
    {
      listIndicateursPredefinis: vi.fn().mockResolvedValue(indicateurs),
    } as unknown as ListIndicateursPredefinisRepository,
    {
      getPersonnalisationReponses: vi.fn().mockResolvedValue({}),
    } as unknown as PersonnalisationsService,
    {
      parseAndEvaluateExpression,
    } as unknown as PersonnalisationsExpressionService,
    {} as unknown as GetReferentielDefinitionService
  );

describe('ValeursReferenceService.getValeursReference', () => {
  it('propage l’échec NOT_FOUND de la collectivité avec sa cause', async () => {
    const cause = new Error('Collectivité avec l’identifiant 3 introuvable');

    const result = await toServiceWithMocks({
      collectivite: failure('NOT_FOUND', cause),
    }).getValeursReference(options);

    expect(result).toEqual(failure('NOT_FOUND', cause));
  });

  it('convertit l’échec de lecture des définitions en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('lecture impossible');

    const result = await toServiceWithMocks({
      indicateurs: failure('DATABASE_ERROR', cause),
    }).getValeursReference(options);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception d’expression en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('expression invalide');

    const result = await toServiceWithMocks({
      parseAndEvaluateExpression: vi.fn().mockImplementation(() => {
        throw cause;
      }),
    }).getValeursReference(options);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('retourne les valeurs de référence évaluées', async () => {
    const result = await toServiceWithMocks({}).getValeursReference(options);

    expect(result).toMatchObject({
      success: true,
      data: [{ indicateurId: 1, cible: 2 }],
    });
  });
});

describe('ValeursReferenceService.getValeursReferenceForDefinition', () => {
  it('propage l’échec NOT_FOUND de la collectivité avec sa cause', async () => {
    const cause = new Error('Collectivité avec l’identifiant 3 introuvable');

    const result = await toServiceWithMocks({
      collectivite: failure('NOT_FOUND', cause),
    }).getValeursReferenceForDefinition({
      collectiviteId,
      indicateur: indicateurWithCible,
      referentielContext,
    });

    expect(result).toEqual(failure('NOT_FOUND', cause));
  });

  it('n’interroge pas la collectivité quand son identité est fournie', async () => {
    const getCollectiviteAvecType = vi.fn();

    const result = await toServiceWithMocks({
      getCollectiviteAvecType,
    }).getValeursReferenceForDefinition({
      collectiviteId,
      indicateur: indicateurWithCible,
      collectiviteAvecType: { id: collectiviteId } as CollectiviteAvecType,
      referentielContext,
    });

    expect(result).toMatchObject({ success: true, data: { cible: 2 } });
    expect(getCollectiviteAvecType).not.toHaveBeenCalled();
  });
});
