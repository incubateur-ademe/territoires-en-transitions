import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { failure, success } from '@tet/backend/utils/result.type';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { ListPlatformDefinitionsApiResponse } from './list-platform-definitions.api-response';
import { ListPlatformDefinitionsController } from './list-platform-definitions.controller';
import { ListPlatformDefinitionsService } from './list-platform-definitions.service';

describe('ListPlatformDefinitionsController response serialization', () => {
  let app: INestApplication;
  const listPlatformDefinitionAggregates = vi.fn();
  const definition: ListPlatformDefinitionsApiResponse['data'][number] = {
    id: 42,
    version: '1.0.0',
    identifiantReferentiel: 'cae_2.a',
    titre: 'Consommation énergétique',
    titreCourt: null,
    titreLong: null,
    description: null,
    unite: 'GWh',
    periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    precision: 2,
    borneMin: null,
    borneMax: null,
    participationScore: false,
    sansValeurUtilisateur: false,
    valeurCalcule: null,
    exprCible: null,
    exprSeuil: null,
    libelleCibleSeuil: null,
    categories: [{ id: 3, nom: 'Énergie' }],
    thematiques: [{ id: 7, nom: 'Climat' }],
    mesures: [{ id: 'cae_1.1.1', nom: 'Définir la stratégie' }],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ListPlatformDefinitionsController],
      providers: [
        {
          provide: ListPlatformDefinitionsService,
          useValue: { listPlatformDefinitionAggregates },
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  beforeEach(() => {
    listPlatformDefinitionAggregates.mockReset();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns the count and public fields, excluding internal aggregate fields', async () => {
    listPlatformDefinitionAggregates.mockResolvedValue(
      success([
        {
          ...definition,
          collectiviteId: 123,
          groupementId: 456,
          createdBy: 'internal-user',
          categories: [{ ...definition.categories[0], internal: true }],
          thematiques: [{ ...definition.thematiques[0], internal: true }],
          mesures: [{ ...definition.mesures[0], internal: true }],
        },
        { ...definition, id: 43, collectiviteId: 123 },
      ])
    );

    await request(app.getHttpServer())
      .get('/indicateurs/definitions')
      .expect(200, {
        count: 2,
        data: [definition, { ...definition, id: 43 }],
      });
  });

  it('returns an empty collection with a zero count', async () => {
    listPlatformDefinitionAggregates.mockResolvedValue(success([]));

    await request(app.getHttpServer())
      .get('/indicateurs/definitions')
      .expect(200, { count: 0, data: [] });
  });

  it('preserves the error response when the service fails', async () => {
    listPlatformDefinitionAggregates.mockResolvedValue(
      failure('DATABASE_ERROR', new Error('database unavailable'))
    );

    const response = await request(app.getHttpServer())
      .get('/indicateurs/definitions')
      .expect(500);

    expect(response.body).toMatchObject({
      statusCode: 500,
      message: "Une erreur de base de données s'est produite",
    });
    expect(response.body).not.toHaveProperty('data');
  });

  it('rejects malformed service data with an internal server error', async () => {
    listPlatformDefinitionAggregates.mockResolvedValue(
      success([{ ...definition, id: 'invalid-id' }])
    );

    await request(app.getHttpServer())
      .get('/indicateurs/definitions')
      .expect(500, {
        statusCode: 500,
        message: 'Internal server error',
      });
  });
});
