import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { CollectiviteController } from '@tet/backend/collectivites/collectivite.controller';
import { ListPlatformDefinitionsController } from '@tet/backend/indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller';
import { ListIndicateursController } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.controller';
import { TrajectoireLeviersController } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.controller';
import { TrajectoiresController } from '@tet/backend/indicateurs/trajectoires/trajectoires.controller';
import { IndicateursValeursController } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.controller';
import { GetReferentielController } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel.controller';
import { ListLabellisationsController } from '@tet/backend/referentiels/labellisations/list-labellisations.controller';
import { ListSnapshotsController } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.controller';
import { ApikeysController } from '@tet/backend/users/apikeys/apikeys.controller';
import { ListUsersController } from '@tet/backend/users/users/list-users/list-users.controller';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { httpApplicationOptions } from './http-application.options';
import { swaggerDocumentOptions } from './swagger-document.options';

describe('REST OpenAPI schemas', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        CollectiviteController,
        ListPlatformDefinitionsController,
        ListIndicateursController,
        TrajectoireLeviersController,
        TrajectoiresController,
        IndicateursValeursController,
        GetReferentielController,
        ListLabellisationsController,
        ListSnapshotsController,
        ApikeysController,
        ListUsersController,
      ],
    })
      .useMocker(() => ({}))
      .compile();

    app = module.createNestApplication(httpApplicationOptions);
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('REST API').setVersion('test').build(),
      swaggerDocumentOptions
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('documents public request schemas and named response components', () => {
    expect(document.paths['/collectivites'].get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'limit',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ default: 20 }),
        }),
      ])
    );
    expect(
      document.paths['/collectivites'].get?.responses['200']
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ListCollectivitesApiResponseClass',
          },
        },
      },
    });
    expect(document.paths['/oauth/token'].post?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GenerateTokenRequestClass' },
        },
      },
    });
    expect(
      document.paths['/indicateurs/definitions'].get?.responses['200']
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ListPlatformDefinitionsApiResponse',
          },
        },
      },
    });
    expect(
      document.paths['/indicateurs/definitions'].get?.responses['201']
    ).toBeUndefined();
    expect(
      document.paths[
        '/collectivites/{collectiviteId}/referentiels/{referentielId}/score-snapshots'
      ].get?.parameters
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'jalons',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ type: 'string' }),
        }),
      ])
    );
    expect(document.components?.schemas).toMatchObject({
      ListCollectivitesApiResponseClass: { type: 'object' },
      ListReferentielsResponseClass: { type: 'array' },
      ListPlatformDefinitionsApiResponse: {
        type: 'object',
        properties: {
          count: { type: 'integer' },
          data: {
            $ref: '#/components/schemas/ListPlatformDefinitionsApiResponseClass',
          },
        },
      },
      GenerateTokenRequestClass: {
        type: 'object',
        properties: { grant_type: { enum: ['client_credentials'] } },
      },
      UpsertIndicateursValeursRequest: {
        type: 'object',
        properties: { valeurs: { type: 'array', minItems: 1 } },
      },
    });
  });

  it('resolves every local reference in the public API document', () => {
    const pending: object[] = [document];
    let referenceCount = 0;

    while (pending.length > 0) {
      const node = pending.pop();
      if (!node) {
        continue;
      }

      for (const [key, value] of Object.entries(node)) {
        if (
          key === '$ref' &&
          typeof value === 'string' &&
          value.startsWith('#/')
        ) {
          const path = decodeURIComponent(value.slice(2))
            .split('/')
            .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
          expect(
            document,
            `Unresolved OpenAPI reference: ${value}`
          ).toHaveProperty(path);
          referenceCount += 1;
        } else if (value !== null && typeof value === 'object') {
          pending.push(value);
        }
      }
    }

    expect(referenceCount).toBeGreaterThan(0);
  });
});
