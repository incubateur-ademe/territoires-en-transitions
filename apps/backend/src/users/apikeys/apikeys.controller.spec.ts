import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { SchemaValidationPipe } from '@tet/backend/utils/nest/schema-validation.pipe';
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
import { ApikeysController } from './apikeys.controller';
import { ApikeysService } from './apikeys.service';
import { GenerateTokenRequest } from './generate-token.request';

describe('ApikeysController request parsing', () => {
  let app: INestApplication;
  const credentials: GenerateTokenRequest = {
    grant_type: 'client_credentials',
    client_id: 'test-client',
    client_secret: 'test-secret',
  };
  const token = {
    access_token: 'test-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };
  const generateToken = vi.fn().mockResolvedValue(token);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ApikeysController],
      providers: [{ provide: ApikeysService, useValue: { generateToken } }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new SchemaValidationPipe(new ContextStoreService()));
    await app.init();
  });

  beforeEach(() => {
    generateToken.mockClear();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('accepts credentials in a multipart text form', async () => {
    await request(app.getHttpServer())
      .post('/oauth/token')
      .set('Host', 'api.example.test')
      .field(credentials)
      .expect(201, token);

    expect(generateToken).toHaveBeenCalledExactlyOnceWith(
      credentials,
      'api.example.test'
    );
  });

  it.each(['json', 'form'])(
    'accepts a %s request body',
    async (contentType) => {
      await request(app.getHttpServer())
        .post('/oauth/token')
        .set('Host', 'api.example.test')
        .type(contentType)
        .send(credentials)
        .expect(201, token);

      expect(generateToken).toHaveBeenCalledExactlyOnceWith(
        credentials,
        'api.example.test'
      );
    }
  );

  it('uses Basic authentication credentials with the multipart grant type', async () => {
    await request(app.getHttpServer())
      .post('/oauth/token')
      .set('Host', 'api.example.test')
      .auth(credentials.client_id, credentials.client_secret)
      .field('grant_type', credentials.grant_type)
      .expect(201, token);

    expect(generateToken).toHaveBeenCalledExactlyOnceWith(
      credentials,
      'api.example.test'
    );
  });

  it('rejects an unsupported grant type before generating a token', async () => {
    await request(app.getHttpServer())
      .post('/oauth/token')
      .field({ ...credentials, grant_type: 'password' })
      .expect(400);

    expect(generateToken).not.toHaveBeenCalled();
  });

  it('rejects file uploads before generating a token', async () => {
    await request(app.getHttpServer())
      .post('/oauth/token')
      .field(credentials)
      .attach('file', Buffer.from('unexpected file'), 'credentials.txt')
      .expect(400);

    expect(generateToken).not.toHaveBeenCalled();
  });
});
