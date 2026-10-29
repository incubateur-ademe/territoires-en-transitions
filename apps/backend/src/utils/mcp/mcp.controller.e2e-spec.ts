import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import { addUserRoleSupport } from '@tet/backend/users/users/users.test-fixture';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { PosthogQueryClient } from '@tet/backend/utils/mcp/tools/run-hogql-query/posthog-query.client';
import { failure, success } from '@tet/backend/utils/result.type';
import { CollectiviteRole } from '@tet/domain/users';
import { AddressInfo } from 'node:net';
import { default as request } from 'supertest';

describe('MCP controller', () => {
  let app: INestApplication;
  let baseUrl: string;
  let supportToken: string;
  let lambdaToken: string;
  let serviceRoleToken: string;

  const connectClient = async (token: string) => {
    const client = new Client({ name: 'tet-e2e', version: '1.0.0' });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
      })
    );
    return client;
  };

  const posthogQueries: string[] = [];
  const fakePosthogQueryClient: Pick<
    PosthogQueryClient,
    'isConfigured' | 'run'
  > = {
    isConfigured: () => true,
    run: async (hogql: string) => {
      posthogQueries.push(hogql);
      if (hogql.includes('erreur_attendue')) {
        return failure('POSTHOG_QUERY_ERROR', new Error('HogQL invalide'));
      }
      const withEmail = hogql.includes('email');
      return success({
        columns: withEmail
          ? ['semaine', 'collectivite_id', 'email']
          : ['semaine', 'collectivite_id'],
        results: [
          ['2025-01-06', '12', ...(withEmail ? ['agent@ville.fr'] : [])],
          ['2025-01-13', '12', ...(withEmail ? ['agent@ville.fr'] : [])],
        ],
        hasMore: false,
      });
    },
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) =>
        builder
          .overrideProvider(PosthogQueryClient)
          .useValue(fakePosthogQueryClient),
    });
    const db = await getTestDatabase(app);
    const secret = app.get(ConfigurationService).get('SUPABASE_JWT_SECRET');

    const { user: supportUser } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    await addUserRoleSupport({
      databaseService: db,
      userId: supportUser.id,
      isSupport: true,
    });
    supportToken = signTestAuthToken(
      {
        ...getAuthUserFromUserCredentials(supportUser).jwtPayload,
        sub: supportUser.id,
      },
      secret
    );

    const { user: lambdaUser } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    lambdaToken = signTestAuthToken(
      {
        ...getAuthUserFromUserCredentials(lambdaUser).jwtPayload,
        sub: lambdaUser.id,
      },
      secret
    );

    serviceRoleToken = signTestAuthToken(
      { role: AuthRole.SERVICE_ROLE },
      secret
    );

    const server = app.getHttpServer();
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    return async () => {
      await app.close();
    };
  });

  describe('authentification et découverte OAuth', () => {
    test('sans jeton : 401 avec WWW-Authenticate vers les métadonnées', async () => {
      const response = await request(app.getHttpServer())
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'ping', id: 1 })
        .expect(401);

      expect(response.headers['www-authenticate']).toMatch(
        /^Bearer .*resource_metadata="http:\/\/127\.0\.0\.1:\d+\/\.well-known\/oauth-protected-resource"/
      );
      expect(response.body).toMatchObject({ error: 'invalid_token' });
    });

    test.each([
      '/.well-known/oauth-protected-resource',
      '/.well-known/oauth-protected-resource/api/v1/mcp',
    ])('métadonnées publiques sur %s', async (path) => {
      const supabaseUrl = app
        .get(ConfigurationService)
        .get('SUPABASE_URL')
        .replace(/\/+$/, '');

      const response = await request(app.getHttpServer()).get(path).expect(200);

      expect(response.body).toEqual({
        resource: expect.stringMatching(
          /^http:\/\/127\.0\.0\.1:\d+\/api\/v1\/mcp$/
        ),
        authorization_servers: [`${supabaseUrl}/auth/v1`],
        bearer_methods_supported: ['header'],
        scopes_supported: [],
      });
    });

    test.each(['get', 'delete'] as const)(
      '%s /mcp : 405 sans session',
      async (method) => {
        const agent = request(app.getHttpServer());
        const response = await agent[method]('/mcp').expect(405);
        expect(response.body.error.code).toBe(-32000);
      }
    );

    test('jeton service_role : 403', async () => {
      await request(app.getHttpServer())
        .post('/mcp')
        .set('Authorization', `Bearer ${serviceRoleToken}`)
        .send({ jsonrpc: '2.0', method: 'ping', id: 1 })
        .expect(403);
    });

    test('utilisateur sans rôle support : 403', async () => {
      await request(app.getHttpServer())
        .post('/mcp')
        .set('Authorization', `Bearer ${lambdaToken}`)
        .send({ jsonrpc: '2.0', method: 'ping', id: 1 })
        .expect(403);
    });
  });

  describe('utilisateur support', () => {
    let client: Client;

    beforeAll(async () => {
      client = await connectClient(supportToken);
      return async () => {
        await client.close();
      };
    });

    test('expose les outils, les ressources et le prompt', async () => {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual([
        'describe_table',
        'list_tables',
        'run_hogql_query',
        'run_sql_query',
      ]);

      const { resources } = await client.listResources();
      expect(resources.map((resource) => resource.uri)).toEqual(
        expect.arrayContaining([
          'tet://docs/regles-metier',
          'tet://docs/base-analytique',
          'tet://docs/posthog-hogql',
        ])
      );

      const { prompts } = await client.listPrompts();
      expect(prompts.map((prompt) => prompt.name)).toContain('analyse-stats');
    });

    test('lit une ressource et le prompt', async () => {
      const { contents } = await client.readResource({
        uri: 'tet://docs/regles-metier',
      });
      expect(contents[0]).toMatchObject({
        mimeType: 'text/markdown',
        text: expect.stringContaining('sous-action'),
      });

      const { messages } = await client.getPrompt({ name: 'analyse-stats' });
      expect(messages.length).toBeGreaterThan(1);
      expect(messages[0].content).toMatchObject({ type: 'text' });
    });

    test('run_sql_query : SELECT simple', async () => {
      const result = await client.callTool({
        name: 'run_sql_query',
        arguments: { sql: 'select 1 as n, 2 as m;' },
      });

      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({
        columns: ['n', 'm'],
        columnCount: 2,
        totalRowCount: 1,
        previewRowCount: 1,
        previewRows: [{ n: 1, m: 2 }],
        truncated: false,
      });
    });

    test('run_sql_query : aperçu tronqué avec le total', async () => {
      const result = await client.callTool({
        name: 'run_sql_query',
        arguments: { sql: 'select generate_series(1, 100) as n' },
      });

      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({
        totalRowCount: 100,
        previewRowCount: 20,
        truncated: true,
      });
    });

    test.each([
      ['UPDATE collectivite SET nom = nom', 'INVALID_SQL'],
      ['select 1; select 2', 'INVALID_SQL'],
      ['select * from information_schema.columns', 'INVALID_SQL'],
      ['select * from table_qui_n_existe_pas', 'ANALYTICS_QUERY_ERROR'],
    ])('run_sql_query refuse « %s »', async (sql, expectedError) => {
      const result = await client.callTool({
        name: 'run_sql_query',
        arguments: { sql },
      });

      expect(result.isError).toBe(true);
      const [content] = result.content as { type: string; text: string }[];
      expect(content.text).toContain(expectedError);
    });

    test('run_hogql_query : fenêtres mensuelles et dédoublonnage', async () => {
      posthogQueries.length = 0;
      const result = await client.callTool({
        name: 'run_hogql_query',
        arguments: {
          hogql:
            "select toStartOfWeek(timestamp) as semaine, properties.collectivite_id as collectivite_id from events where timestamp >= toDateTime('{start}', 'UTC') and timestamp < toDateTime('{end}', 'UTC') limit 50000",
          dateFrom: '2025-01-01',
          dateTo: '2025-03-01',
        },
      });

      expect(result.isError).toBeFalsy();
      expect(posthogQueries).toHaveLength(2);
      expect(posthogQueries[0]).toContain(
        "toDateTime('2025-01-01 00:00:00', 'UTC')"
      );
      expect(posthogQueries[1]).toContain(
        "toDateTime('2025-03-01 00:00:00', 'UTC')"
      );
      expect(result.structuredContent).toMatchObject({
        columns: ['semaine', 'collectivite_id'],
        totalRowCount: 2,
        previewRows: [
          { semaine: '2025-01-06', collectivite_id: '12' },
          { semaine: '2025-01-13', collectivite_id: '12' },
        ],
        meta: {
          windows: 2,
          truncatedWindows: [],
          rowCapReached: false,
          emailColumnsRemoved: [],
        },
      });
    });

    // La base de test n'a pas `public.internal_users` : avec une colonne
    // e-mail, l'outil refuse plutôt que de laisser passer des internes.
    test('run_hogql_query : colonne e-mail sans liste des internes, refus', async () => {
      const result = await client.callTool({
        name: 'run_hogql_query',
        arguments: {
          hogql:
            'select toStartOfWeek(timestamp) as semaine, properties.collectivite_id as collectivite_id, person.properties.email as email from events limit 100',
        },
      });

      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain(
        'INTERNAL_USERS_UNAVAILABLE'
      );
    });

    test('run_hogql_query : marqueurs sans dateFrom et erreur PostHog', async () => {
      const missingDate = await client.callTool({
        name: 'run_hogql_query',
        arguments: { hogql: "select 1 where x > '{start}' and x < '{end}'" },
      });
      expect(missingDate.isError).toBe(true);
      expect((missingDate.content as { text: string }[])[0].text).toContain(
        'INVALID_DATE_RANGE'
      );

      const failed = await client.callTool({
        name: 'run_hogql_query',
        arguments: { hogql: 'select erreur_attendue from events limit 10' },
      });
      expect(failed.isError).toBe(true);
      expect((failed.content as { text: string }[])[0].text).toContain(
        'POSTHOG_QUERY_ERROR'
      );
    });

    test('list_tables et describe_table lisent le catalogue', async () => {
      const tables = await client.callTool({
        name: 'list_tables',
        arguments: { schema: 'public' },
      });
      expect(tables.isError).toBeFalsy();
      expect(
        (tables.structuredContent as { tables: { name: string }[] }).tables.map(
          (table) => table.name
        )
      ).toContain('collectivite');

      const columns = await client.callTool({
        name: 'describe_table',
        arguments: { schema: 'public', table: 'collectivite' },
      });
      expect(columns.isError).toBeFalsy();
      expect(
        (
          columns.structuredContent as { columns: { name: string }[] }
        ).columns.map((column) => column.name)
      ).toContain('id');

      const missing = await client.callTool({
        name: 'describe_table',
        arguments: { schema: 'public', table: 'table_qui_n_existe_pas' },
      });
      expect(missing.isError).toBe(true);
    });
  });

  // Une CTE modifiante est déjà refusée par la sous-requête `LIMIT` (elle doit
  // être au niveau supérieur) ; `nextval` passe la syntaxe et bute sur la
  // session en lecture seule.
  test('avec le préfixe global de main.ts, les métadonnées restent à la racine', async () => {
    const prefixedApp = await getDisposableTestApp({ withGlobalPrefix: true });
    onTestFinished(async () => {
      await prefixedApp.close();
    });
    const server = prefixedApp.getHttpServer();

    await request(server)
      .get('/.well-known/oauth-protected-resource')
      .expect(200);
    await request(server)
      .get('/.well-known/oauth-protected-resource/api/v1/mcp')
      .expect(200);
    await request(server)
      .get('/api/v1/.well-known/oauth-protected-resource')
      .expect(404);
    await request(server).post('/api/v1/mcp').expect(401);
    await request(server).post('/mcp').expect(404);
  });

  test('la connexion analytique est en lecture seule', async () => {
    const result = await app.get(AnalyticsDatabaseService).query({
      text: "select nextval('collectivite_id_seq') as n",
      maxRows: 1,
    });

    expect(result).toMatchObject({
      success: false,
      error: 'ANALYTICS_QUERY_READ_ONLY_VIOLATION',
    });
  });
});
