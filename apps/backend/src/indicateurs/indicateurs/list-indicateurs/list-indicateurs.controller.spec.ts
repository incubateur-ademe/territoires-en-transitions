import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { cleanupOpenApiDoc } from 'nestjs-zod';
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
import { listIndicateursApiResponseSchema } from './list-indicateurs.api-response';
import { ListIndicateursController } from './list-indicateurs.controller';
import type { IndicateurListItem } from './list-indicateurs.output';
import { ListIndicateursService } from './list-indicateurs.service';

describe('ListIndicateursController public response', () => {
  let app: INestApplication;
  const listIndicateurs = vi.fn();
  const indicateur: IndicateurListItem = {
    id: 42,
    version: '1.0.0',
    groupementId: null,
    collectiviteId: 123,
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
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-02T00:00:00.000Z',
    createdBy: null,
    modifiedBy: null,
    commentaire: null,
    estFavori: true,
    estConfidentiel: null,
    isApplicable: true,
    isSuivi: false,
    categories: [{ id: 3, nom: 'Énergie' }],
    thematiques: [],
    pilotes: [],
    services: [],
    enfants: [],
    parent: null,
    fiches: [{ id: 17, titre: 'Réduire les consommations énergétiques' }],
    mesures: [],
    groupementCollectivites: [],
    hasOpenData: false,
    estPerso: true,
    estAgregation: false,
    estRempli: false,
  };
  const parent: NonNullable<IndicateurListItem['parent']> = {
    id: 40,
    identifiantReferentiel: null,
    titre: 'Consommation totale',
    titreCourt: null,
    parent: {
      id: 39,
      identifiantReferentiel: null,
      titre: 'Bilan énergétique',
      titreCourt: null,
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ListIndicateursController],
      providers: [
        { provide: ListIndicateursService, useValue: { listIndicateurs } },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(new CustomZodValidationPipe(new ContextStoreService()));
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(() => {
    listIndicateurs.mockReset();
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([null, parent])(
    'returns pagination and public field names with parent %j',
    async (parent) => {
      const pagination = { count: 21, pageCount: 3, pageSize: 10, page: 2 };
      listIndicateurs.mockResolvedValue({
        ...pagination,
        data: [{ ...indicateur, parent }],
      });

      const response = await request(app.getHttpServer())
        .get('/indicateurs?collectiviteId=123&page=2&limit=10')
        .expect(200);

      const {
        estFavori,
        estConfidentiel,
        fiches,
        parent: _,
        ...fields
      } = indicateur;
      expect(response.body).toEqual({
        ...pagination,
        data: [
          {
            ...fields,
            favoris: estFavori,
            confidentiel: estConfidentiel,
            ficheActions: fiches,
            parents: parent ? [parent] : [],
          },
        ],
      });
      expect(listIndicateursApiResponseSchema.parse(response.body)).toEqual(
        response.body
      );
    }
  );

  it('returns an empty collection with pagination', async () => {
    const result = { count: 0, pageCount: 0, pageSize: 10, page: 1, data: [] };
    listIndicateurs.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/indicateurs?collectiviteId=123&limit=10')
      .expect(200, result);
  });

  it('documents HTTP 200, the pagination envelope and public field names', () => {
    const document = cleanupOpenApiDoc(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('Indicateurs API')
          .setVersion('test')
          .build()
      )
    );

    expect(document.paths['/indicateurs'].get?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ListIndicateursApiResponseClass',
          },
        },
      },
    });
    expect(
      document.paths['/indicateurs'].get?.responses['201']
    ).toBeUndefined();
    const schema =
      document.components?.schemas?.ListIndicateursApiResponseClass;
    expect(schema).toMatchObject({
      type: 'object',
      required: ['count', 'pageCount', 'pageSize', 'page', 'data'],
      properties: {
        count: { type: 'integer' },
        pageCount: { type: 'integer' },
        pageSize: { type: 'integer' },
        page: { type: 'integer' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              favoris: { type: 'boolean', nullable: true },
              confidentiel: { type: 'boolean', nullable: true },
              ficheActions: {
                type: 'array',
                items: {
                  properties: {
                    id: { type: 'number' },
                    titre: { type: 'string' },
                  },
                },
              },
              parents: {
                type: 'array',
                items: {
                  properties: {
                    id: { type: 'number' },
                    parent: { nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    });
    for (const field of ['estFavori', 'estConfidentiel', 'fiches', 'parent']) {
      expect(schema).not.toHaveProperty(
        `properties.data.items.properties.${field}`
      );
    }
  });
});
