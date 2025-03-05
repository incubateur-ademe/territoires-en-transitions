import { SentryEventWebhookPayload } from '../SentryEventWebhookPayload';

export const sampleSentryErrorEvent: SentryEventWebhookPayload = {
  id: '154586',
  project: 'territoires-en-transitions',
  project_name: 'territoires-en-transitions',
  project_slug: 'territoires-en-transitions',
  logger: null,
  level: 'error',
  culprit: 'GET /api/v1/indicateurs/import',
  message: '',
  url: 'https://sentry.incubateur.net/organizations/betagouv/issues/154586/?referrer=webhooks_plugin',
  triggering_rules: ['webhook-alert'],
  event: {
    event_id: '3e7fee1d40dc47b0abb7ffb7947fc5a1',
    level: 'error',
    //version: '7',
    type: undefined, // 'error',
    fingerprint: ['{{ default }}'],
    //culprit: 'GET /api/v1/indicateurs/import',
    transaction: 'GET /api/v1/indicateurs/import',
    logger: '',
    platform: 'node',
    timestamp: 1741195923.323,
    //received: 1741195923.363629,
    environment: 'production',
    request: {
      url: 'http://preprod-api.territoiresentransitions.fr/api/v1/indicateurs/import',
      method: 'GET',
      /*
      headers: [
        ['Accept-Encoding', 'gzip, br'],
        ['Authorization', '[Filtered]'],
        ['Cdn-Loop', 'cloudflare; loops=1'],
        ['Cf-Connecting-Ip', '[ip]'],
        ['Cf-Ipcountry', 'US'],
        ['Cf-Ray', '91bb59af3c1ebcec-ATL'],
        ['Cf-Visitor', '{"scheme":"https"}'],
        ['Content-Type', 'application/json'],
        ['Host', 'preprod-api.territoiresentransitions.fr'],
        [
          'User-Agent',
          'Mozilla/5.0 (compatible; Google-Apps-Script; beanserver; +https://script.google.com; id: UAEmdDd8CZ29xnESPybcu3GdUjSDiELGWkQ)',
        ],
        ['X-B3-Parentspanid', '210556d2f1fc93d8'],
        ['X-B3-Sampled', '1'],
        ['X-B3-Spanid', '17df0da5671177f5'],
        ['X-B3-Traceid', '6606e21518e04529'],
        ['X-Envoy-Original-Path', '/api/v1/indicateurs/import'],
        ['X-Forwarded-For', '[ip],[ip]'],
        ['X-Forwarded-Host', 'preprod-api.territoiresentransitions.fr'],
        ['X-Forwarded-Proto', 'https'],
        ['X-Forwarded-Server', 'ATL'],
        ['X-Koyeb-Backend', 'par'],
        ['X-Koyeb-Glb', 'was'],
        ['X-Koyeb-Host-Port', 'c7001069-ca11-4fd7-86c6-7feb45b9b68d:3000'],
        ['X-Koyeb-Original-Host', 'preprod-api.territoiresentransitions.fr'],
        ['X-Koyeb-Route', 'c7001069-ca11-4fd7-86c6-7feb45b9b68d-3000_prod'],
        ['X-Koyeb-Service-Id', 'c7001069-ca11-4fd7-86c6-7feb45b9b68d'],
        ['X-Request-Id', '6f258abf-4165-9978-98e4-af47427df22b'],
      ],
      inferred_content_type: 'application/json',*/
    },
    contexts: {
      app: {
        app_start_time: '2025-03-05T13:47:34.922Z',
        app_memory: 285237248,
        free_memory: 1806295040,
        type: 'app',
      },
      cloud_resource: {
        type: 'cloud_resource',
      },
      culture: {
        locale: 'fr-FR',
        timezone: 'UTC',
        type: 'culture',
      },
      device: {
        arch: 'x64',
        memory_size: 2103889920,
        free_memory: 1806295040,
        boot_time: '2025-03-05T13:47:34.494Z',
        processor_count: 2,
        cpu_description: 'AMD EPYC 7313P 16-Core Processor',
        processor_frequency: 0,
        type: 'device',
      },
      os: {
        name: 'Debian',
        version: '12.6\n',
        kernel_version: '6.1.62',
        type: 'os',
      },
      profile: {
        profile_id: '663b3c423b8e4ccfa05a706fbdeb1ef9',
        type: 'profile',
      },
      runtime: {
        name: 'node',
        version: 'v20.15.1',
        type: 'runtime',
      },
      trace: {
        trace_id: '0e17e5cbd3657ca24cb76523f9f082cc',
        span_id: '312c7db3f19ea538',
        parent_span_id: '67de8c008c13ec6f',
        status: 'unknown',
        client_sample_rate: 1,
        type: 'trace',
      },
    } /*
    breadcrumbs: {
      values: [
        {
          timestamp: 1741182459.796,
          type: 'http',
          category: 'http',
          level: 'info',
          data: {
            'http.method': 'POST',
            'http.query':
              '?sentry_version=7&sentry_key=74a431d31d2e46759762c73709a68084&sentry_client=sentry.javascript.nestjs%2F8.54.0',
            status_code: 200,
            url: 'https://sentry.incubateur.net/api/105/envelope/',
          },
        },
        {
          timestamp: 1741182460.042,
          type: 'http',
          category: 'http',
          level: 'info',
          data: {
            'http.method': 'POST',
            status_code: 200,
            url: '[Filtered]',
          },
        },
        {
          timestamp: 1741182465.178,
          type: 'http',
          category: 'http',
          level: 'info',
          data: {
            'http.method': 'GET',
            'http.query': '?alt=media',
            status_code: 200,
            url: 'https://www.googleapis.com/drive/v3/files/1EYPH3_rsJQFn0pZ1ONCQWlUeMUCyp6S3',
          },
        },
        {
          timestamp: 1741195922.414,
          type: 'http',
          category: 'http',
          level: 'info',
          data: {
            'http.method': 'POST',
            status_code: 200,
            url: '[Filtered]',
          },
        },
        {
          timestamp: 1741195923.318,
          type: 'http',
          category: 'http',
          level: 'info',
          data: {
            'http.method': 'GET',
            'http.query': '?valueRenderOption=FORMATTED_VALUE',
            status_code: 200,
            url: 'https://sheets.googleapis.com/v4/spreadsheets/1im08NvNBGsVb-xB2Lmh-3sgKO7Tje7jUAYQOCNixnuM/values/Versions%21A%3AZ',
          },
        },
      ],
    },*/,
    exception: {
      values: [
        {
          type: 'UnprocessableEntityException',
          value:
            'Version 1.0.12 is not greater than current version 1.0.12, please add a new version in the changelog',
          stacktrace: {
            frames: [
              {
                module:
                  '@opentelemetry.instrumentation-nestjs-core.build.src:instrumentation',
                filename:
                  '/app/node_modules/.pnpm/@opentelemetry+instrumentation-nestjs-core@0.44.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-nestjs-core/build/src/instrumentation.js',
                abs_path:
                  '/app/node_modules/.pnpm/@opentelemetry+instrumentation-nestjs-core@0.44.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-nestjs-core/build/src/instrumentation.js',
                lineno: 129,
                colno: 24,
                pre_context: [
                  '        attributes: Object.assign(Object.assign({}, NestInstrumentation.COMMON_ATTRIBUTES), { [enums_1.AttributeNames.VERSION]: moduleVersio {snip}',
                  '    };',
                  '    const wrappedHandler = function () {',
                  '        const span = tracer.startSpan(spanName, options);',
                  '        const spanContext = api.trace.setSpan(api.context.active(), span);',
                  '        return api.context.with(spanContext, async () => {',
                  '            try {',
                ],
                context_line:
                  '                return await handler.apply(this, arguments);',
                post_context: [
                  '            }',
                  '            catch (e) {',
                  '                throw addError(span, e);',
                  '            }',
                  '            finally {',
                  '                span.end();',
                  '            }',
                ],
                in_app: false,
              },
              {
                function:
                  'ImportIndicateurDefinitionService.importIndicateurDefinitions',
                module:
                  'indicateurs.import-indicateurs:import-indicateur-definition.service',
                filename:
                  '/app/dist/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.js',
                abs_path:
                  '/app/dist/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.js',
                lineno: 94,
                colno: 29,
                pre_context: [
                  '        });',
                  '        await this.sheetService.overwriteTypedDataToSheet(this.getSpreadsheetId(), this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER, importInd {snip}',
                  '        return { data: importIndicateurDefinitions };',
                  '    }',
                  '    async importIndicateurDefinitions() {',
                  "        const indicateurDefinitions = await this.indicateurDefinitionService.getReferentielIndicateurDefinitions(['cae_1.a']);",
                  '        const spreadsheetId = this.getSpreadsheetId();',
                ],
                context_line:
                  '        const lastVersion = await this.checkLastVersion(indicateurDefinitions.length ? indicateurDefinitions[0].version : null);',
                post_context: [
                  '        const sheetRange = this.sheetService.getDefaultRangeFromHeader(this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER, this.INDICATEUR_DEFIN {snip}',
                  '        // Create a template data to set version & initialize null properties',
                  '        const templateData = {',
                  '            version: lastVersion,',
                  '            titreCourt: null,',
                  '            titreLong: null,',
                  '            description: null,',
                ],
                in_app: true,
              },
              {
                function: 'process.processTicksAndRejections',
                module: 'task_queues',
                filename: 'node:internal/process/task_queues',
                abs_path: 'node:internal/process/task_queues',
                lineno: 95,
                colno: 5,
                in_app: false,
              },
              {
                function: 'ImportIndicateurDefinitionService.checkLastVersion',
                module: 'shared.services:base-spreadsheet-importer.service',
                filename:
                  '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
                abs_path:
                  '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
                lineno: 34,
                colno: 19,
                pre_context: [
                  '        changeLogVersions.forEach((version) => {',
                  '            if (semver.gt(version.version, lastVersion)) {',
                  '                lastVersion = version.version;',
                  '            }',
                  '        });',
                  '        this.logger.log(`Last version found in changelog: ${lastVersion}`);',
                  '        if (currentVersion && !semver.gt(lastVersion, currentVersion)) {',
                ],
                context_line:
                  '            throw new common_1.UnprocessableEntityException(`Version ${lastVersion} is not greater than current version ${currentVersion}, p {snip}',
                post_context: [
                  '        }',
                  '        else {',
                  '            // Return last version',
                  '            return lastVersion;',
                  '        }',
                  '    }',
                  '}',
                ],
                in_app: true,
              },
            ],
          } /*
          raw_stacktrace: {
            frames: [
              {
                module:
                  '@opentelemetry.instrumentation-nestjs-core.build.src:instrumentation',
                filename:
                  '/app/node_modules/.pnpm/@opentelemetry+instrumentation-nestjs-core@0.44.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-nestjs-core/build/src/instrumentation.js',
                abs_path:
                  '/app/node_modules/.pnpm/@opentelemetry+instrumentation-nestjs-core@0.44.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-nestjs-core/build/src/instrumentation.js',
                lineno: 129,
                colno: 24,
                pre_context: [
                  '        attributes: Object.assign(Object.assign({}, NestInstrumentation.COMMON_ATTRIBUTES), { [enums_1.AttributeNames.VERSION]: moduleVersio {snip}',
                  '    };',
                  '    const wrappedHandler = function () {',
                  '        const span = tracer.startSpan(spanName, options);',
                  '        const spanContext = api.trace.setSpan(api.context.active(), span);',
                  '        return api.context.with(spanContext, async () => {',
                  '            try {',
                ],
                context_line:
                  '                return await handler.apply(this, arguments);',
                post_context: [
                  '            }',
                  '            catch (e) {',
                  '                throw addError(span, e);',
                  '            }',
                  '            finally {',
                  '                span.end();',
                  '            }',
                ],
                in_app: false,
              },
              {
                function:
                  'ImportIndicateurDefinitionService.importIndicateurDefinitions',
                module:
                  'indicateurs.import-indicateurs:import-indicateur-definition.service',
                filename:
                  '/app/dist/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.js',
                abs_path:
                  '/app/dist/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.js',
                lineno: 94,
                colno: 29,
                pre_context: [
                  '        });',
                  '        await this.sheetService.overwriteTypedDataToSheet(this.getSpreadsheetId(), this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER, importInd {snip}',
                  '        return { data: importIndicateurDefinitions };',
                  '    }',
                  '    async importIndicateurDefinitions() {',
                  "        const indicateurDefinitions = await this.indicateurDefinitionService.getReferentielIndicateurDefinitions(['cae_1.a']);",
                  '        const spreadsheetId = this.getSpreadsheetId();',
                ],
                context_line:
                  '        const lastVersion = await this.checkLastVersion(indicateurDefinitions.length ? indicateurDefinitions[0].version : null);',
                post_context: [
                  '        const sheetRange = this.sheetService.getDefaultRangeFromHeader(this.INDICATEUR_DEFINITIONS_SPREADSHEET_HEADER, this.INDICATEUR_DEFIN {snip}',
                  '        // Create a template data to set version & initialize null properties',
                  '        const templateData = {',
                  '            version: lastVersion,',
                  '            titreCourt: null,',
                  '            titreLong: null,',
                  '            description: null,',
                ],
                in_app: true,
              },
              {
                function: 'process.processTicksAndRejections',
                module: 'task_queues',
                filename: 'node:internal/process/task_queues',
                abs_path: 'node:internal/process/task_queues',
                lineno: 95,
                colno: 5,
                in_app: false,
              },
              {
                function: 'ImportIndicateurDefinitionService.checkLastVersion',
                module: 'shared.services:base-spreadsheet-importer.service',
                filename:
                  '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
                abs_path:
                  '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
                lineno: 34,
                colno: 19,
                pre_context: [
                  '        changeLogVersions.forEach((version) => {',
                  '            if (semver.gt(version.version, lastVersion)) {',
                  '                lastVersion = version.version;',
                  '            }',
                  '        });',
                  '        this.logger.log(`Last version found in changelog: ${lastVersion}`);',
                  '        if (currentVersion && !semver.gt(lastVersion, currentVersion)) {',
                ],
                context_line:
                  '            throw new common_1.UnprocessableEntityException(`Version ${lastVersion} is not greater than current version ${currentVersion}, p {snip}',
                post_context: [
                  '        }',
                  '        else {',
                  '            // Return last version',
                  '            return lastVersion;',
                  '        }',
                  '    }',
                  '}',
                ],
                in_app: true,
              },
            ],
          },*/,
          mechanism: {
            type: 'generic',
            handled: true,
          },
        },
      ],
    },
    /*
    tags: [
      ['correlation_id', 'eaf47317-c563-40f2-91ed-b057b5d4969a'],
      ['environment', 'production'],
      ['handled', 'yes'],
      ['level', 'error'],
      ['mechanism', 'generic'],
      ['os', 'Debian 12.6'],
      ['os.name', 'Debian'],
      ['runtime', 'node v20.15.1'],
      ['runtime.name', 'node'],
      ['server_name', 'b77b52c9'],
      ['service', 'backend'],
      ['source', 'nestjs'],
      ['transaction', 'GET /api/v1/indicateurs/import'],
      [
        'url',
        'http://preprod-api.territoiresentransitions.fr/api/v1/indicateurs/import',
      ],
      ['version', 'ecdd862'],
    ],*/
    sdk: {
      name: 'sentry.javascript.nestjs',
      version: '8.54.0',
      integrations: [
        'InboundFilters',
        'FunctionToString',
        'LinkedErrors',
        'RequestData',
        'Console',
        'Http',
        'NodeFetch',
        'OnUncaughtException',
        'OnUnhandledRejection',
        'ContextLines',
        'LocalVariablesAsync',
        'Context',
        'ProcessAndThreadBreadcrumbs',
        'Modules',
        'Express',
        'Fastify',
        'Graphql',
        'Mongo',
        'Mongoose',
        'Mysql',
        'Mysql2',
        'Redis',
        'Postgres',
        'Nest',
        'Hapi',
        'Koa',
        'Connect',
        'Tedious',
        'GenericPool',
        'Kafka',
        'Amqplib',
        'LruMemoizer',
        'vercelAI',
        'ProfilingIntegration',
      ],
      packages: [
        {
          name: 'npm:@sentry/nestjs',
          version: '8.54.0',
        },
      ],
    },
    /*
    errors: [
      {
        type: 'js_no_source',
        symbolicator_type: 'missing_source',
        url: '/app/dist/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.js',
      },
      {
        type: 'js_no_source',
        symbolicator_type: 'missing_source',
        url: '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
      },
      {
        type: 'js_no_source',
        symbolicator_type: 'missing_source',
        url: '/app/node_modules/.pnpm/@opentelemetry+instrumentation-nestjs-core@0.44.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-nestjs-core/build/src/instrumentation.js',
      },
    ],*/
    //key_id: '107',
    //project: 105,
    /*grouping_config: {
      enhancements: 'KLUv_SAYwQAAkwKRs25ld3N0eWxlOjIwMjMtMDEtMTGQ',
      id: 'newstyle:2023-01-11',
    },
    _metrics: {
      'bytes.ingested.event': 7847,
      'bytes.stored.event': 16909,
    },
    _ref: 105,
    _ref_version: 2,
    
    hashes: [
      '6a080ee572760aafcbf230f51951ece3',
      'bf12a058ef8a1a8344a1881d8a410ab7',
    ],
    location:
      '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
      
    metadata: {
      display_title_with_tree_label: false,
      filename:
        '/app/dist/backend/src/shared/services/base-spreadsheet-importer.service.js',
      function: 'ImportIndicateurDefinitionService.checkLastVersion',
      in_app_frame_mix: 'mixed',
      type: 'UnprocessableEntityException',
      value:
        'Version 1.0.12 is not greater than current version 1.0.12, please add a new version in the changelog',
    },
    nodestore_insert: 1741195923.527184,
    title:
      'UnprocessableEntityException: Version 1.0.12 is not greater than current version 1.0.12, please add a new version in the changelog',
    _meta: {
      breadcrumbs: {
        values: {
          '1': {
            data: {
              url: {
                '': {
                  rem: [['@password:filter', 's', 0, 10]],
                  len: 42,
                },
              },
            },
          },
          '3': {
            data: {
              url: {
                '': {
                  rem: [['@password:filter', 's', 0, 10]],
                  len: 42,
                },
              },
            },
          },
        },
      },
      request: {
        headers: {
          '1': {
            '1': {
              '': {
                rem: [['@password:filter', 's', 0, 10]],
                len: 154,
              },
            },
          },
          '3': {
            '1': {
              '': {
                rem: [['@ip:replace', 's', 0, 4]],
                len: 13,
              },
            },
          },
          '15': {
            '1': {
              '': {
                rem: [
                  ['@ip:replace', 's', 0, 4],
                  ['@ip:replace', 's', 5, 9],
                ],
                len: 26,
              },
            },
          },
        },
      },
    },
    id: '3e7fee1d40dc47b0abb7ffb7947fc5a1',
    */
  },
};
