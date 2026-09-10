import type { EmtWorksheet } from './import-emt-indicateurs.service.ts';
import {
  type ImportEmtIndicateursInput,
  ImportEmtIndicateursService,
} from './import-emt-indicateurs.service.ts';
import { createImportEmtIndicateursHandler } from './import-emt-indicateurs.handler.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const emptyWorksheet: EmtWorksheet = {
  firstDataRow: 1,
  lastDataRowExclusive: 1,
  getCellValue: () => null,
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const makeMultipartRequest = ({
  authorization = 'Bearer service-secret',
  collectiviteId = '42',
  referentiel = 'cae',
  includeFile = true,
}: Readonly<{
  authorization?: string;
  collectiviteId?: string;
  referentiel?: string;
  includeFile?: boolean;
}> = {}): Request => {
  const data = new FormData();
  data.set('collectivite_id', collectiviteId);
  data.set('referentiel', referentiel);
  if (includeFile) {
    data.set('file', new File([new Uint8Array([1])], 'emt.xlsx'));
  }
  return new Request('http://localhost/import_indicateur_emt', {
    method: 'POST',
    headers: { authorization },
    body: data,
  });
};

const assertCors = (response: Response): void => {
  assert(
    response.headers.get('access-control-allow-origin') === '*',
    'the response should allow the configured CORS origin'
  );
  assert(
    response.headers.get('access-control-allow-headers') ===
      'authorization, content-type',
    'the response should expose the configured CORS headers'
  );
};

Deno.test(
  'answers OPTIONS with CORS without touching authorization or infrastructure',
  async () => {
    let dependencyCallCount = 0;
    const handler = createImportEmtIndicateursHandler({
      corsHeaders: CORS_HEADERS,
      getServiceRoleKey: () => {
        dependencyCallCount += 1;
        return undefined;
      },
      decodeWorksheet: () => {
        dependencyCallCount += 1;
        return Promise.resolve(emptyWorksheet);
      },
      createImportService: () => {
        dependencyCallCount += 1;
        return { import: () => Promise.resolve({ writtenValeursCount: 0 }) };
      },
      reportError: () => {
        dependencyCallCount += 1;
      },
    });

    const response = await handler(
      new Request('http://localhost/import_indicateur_emt', {
        method: 'OPTIONS',
      })
    );

    assert(response.status === 200, 'OPTIONS should succeed');
    assert((await response.text()) === 'ok', 'OPTIONS should return ok');
    assertCors(response);
    assert(
      dependencyCallCount === 0,
      'preflight should not initialize protected infrastructure'
    );
  }
);

Deno.test(
  'rejects missing and incorrect service-role credentials',
  async () => {
    const authorizationCases = [
      { serviceRoleKey: undefined, authorization: 'Bearer undefined' },
      { serviceRoleKey: undefined, authorization: 'Bearer service-secret' },
      {
        serviceRoleKey: 'service-secret',
        authorization: 'Bearer wrong-secret',
      },
    ] as const;

    for (const { serviceRoleKey, authorization } of authorizationCases) {
      let infrastructureCalled = false;
      const handler = createImportEmtIndicateursHandler({
        corsHeaders: CORS_HEADERS,
        getServiceRoleKey: () => serviceRoleKey,
        decodeWorksheet: () => {
          infrastructureCalled = true;
          return Promise.resolve(emptyWorksheet);
        },
        createImportService: () => {
          infrastructureCalled = true;
          return { import: () => Promise.resolve({ writtenValeursCount: 0 }) };
        },
        reportError: () => {
          infrastructureCalled = true;
        },
      });

      const response = await handler(makeMultipartRequest({ authorization }));

      assert(
        response.status === 403,
        'invalid credentials should be forbidden'
      );
      assert(
        (await response.text()) === 'Execute access forbidden',
        'the existing forbidden response should be preserved'
      );
      assertCors(response);
      assert(
        !infrastructureCalled,
        'unauthorized requests should not decode or access persistence'
      );
    }
  }
);

Deno.test(
  'rejects methods other than OPTIONS and POST before authorization',
  async () => {
    let dependencyCalled = false;
    const handler = createImportEmtIndicateursHandler({
      corsHeaders: CORS_HEADERS,
      getServiceRoleKey: () => {
        dependencyCalled = true;
        return 'service-secret';
      },
      decodeWorksheet: () => Promise.resolve(emptyWorksheet),
      createImportService: () => ({
        import: () => Promise.resolve({ writtenValeursCount: 0 }),
      }),
      reportError: () => undefined,
    });

    const response = await handler(
      new Request('http://localhost/import_indicateur_emt', { method: 'GET' })
    );
    const body = (await response.json()) as {
      error: { code: string };
    };

    assert(response.status === 405, 'GET should not execute an import');
    assert(
      response.headers.get('allow') === 'OPTIONS, POST',
      'the response should advertise supported methods'
    );
    assert(
      body.error.code === 'METHOD_NOT_ALLOWED',
      'the error should be typed'
    );
    assertCors(response);
    assert(!dependencyCalled, 'unsupported methods should not initialize auth');
  }
);

Deno.test('returns a 4xx response for a missing multipart file', async () => {
  const errors: unknown[] = [];
  let decoderCalled = false;
  const handler = createImportEmtIndicateursHandler({
    corsHeaders: CORS_HEADERS,
    getServiceRoleKey: () => 'service-secret',
    decodeWorksheet: () => {
      decoderCalled = true;
      return Promise.resolve(emptyWorksheet);
    },
    createImportService: () => ({
      import: () => Promise.resolve({ writtenValeursCount: 0 }),
    }),
    reportError: (error) => errors.push(error),
  });

  const response = await handler(makeMultipartRequest({ includeFile: false }));

  assert(response.status === 422, 'input errors should not return success');
  assertCors(response);
  assert(
    ((await response.json()) as { error: { message: string } }).error
      .message === 'Le fichier EMT est obligatoire',
    'the missing file should be reported'
  );
  assert(!decoderCalled, 'a missing file should fail before decoding');
  assert(
    errors.length === 0,
    'caller errors should not be reported as outages'
  );
});

Deno.test(
  'returns a safe 4xx response for an unreadable workbook',
  async () => {
    const errors: unknown[] = [];
    const handler = createImportEmtIndicateursHandler({
      corsHeaders: CORS_HEADERS,
      getServiceRoleKey: () => 'service-secret',
      decodeWorksheet: () => Promise.reject(new Error('internal ZIP details')),
      createImportService: () => ({
        import: () => Promise.resolve({ writtenValeursCount: 0 }),
      }),
      reportError: (error) => errors.push(error),
    });

    const response = await handler(makeMultipartRequest());
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    assert(response.status === 422, 'an unreadable workbook is invalid input');
    assert(
      body.error.message === 'Le fichier EMT ne peut pas être lu',
      'decoder internals should not be exposed'
    );
    assert(
      errors.length === 0,
      'invalid workbooks should not report an outage'
    );
  }
);

Deno.test(
  'validates multipart identifiers through the application service',
  async () => {
    let definitionsReadCount = 0;
    const importService = new ImportEmtIndicateursService({
      listDefinitions: () => {
        definitionsReadCount += 1;
        return Promise.resolve(new Map());
      },
      importAnnualValeurs: () => Promise.resolve(1),
    });
    const handler = createImportEmtIndicateursHandler({
      corsHeaders: CORS_HEADERS,
      getServiceRoleKey: () => 'service-secret',
      decodeWorksheet: () => Promise.resolve(emptyWorksheet),
      createImportService: () => importService,
      reportError: () => undefined,
    });

    const invalidCollectiviteResponse = await handler(
      makeMultipartRequest({ collectiviteId: 'invalide' })
    );
    const partiallyNumericCollectiviteResponse = await handler(
      makeMultipartRequest({ collectiviteId: '12-invalide' })
    );
    const invalidReferentielResponse = await handler(
      makeMultipartRequest({ referentiel: '   ' })
    );

    assert(
      invalidCollectiviteResponse.status === 422,
      'an invalid collectivity should return a 4xx response'
    );
    assert(
      (
        (await invalidCollectiviteResponse.json()) as {
          error: { message: string };
        }
      ).error.message === 'Collectivité invalide : NaN',
      'the parsed collectivity identifier should be validated'
    );
    assert(
      partiallyNumericCollectiviteResponse.status === 422,
      'a partially numeric collectivity must not be truncated'
    );
    assert(
      invalidReferentielResponse.status === 422,
      'an invalid referential should return a 4xx response'
    );
    assert(
      (
        (await invalidReferentielResponse.json()) as {
          error: { message: string };
        }
      ).error.message === 'Le référentiel EMT est obligatoire',
      'the referential identifier should be validated'
    );
    assert(
      definitionsReadCount === 0,
      'invalid identifiers should fail before persistence is read'
    );
  }
);

Deno.test(
  'passes an authorized multipart request to the import service',
  async () => {
    const receivedInputs: ImportEmtIndicateursInput[] = [];
    let decodedFile: File | undefined;
    let serviceCreationCount = 0;
    const handler = createImportEmtIndicateursHandler({
      corsHeaders: CORS_HEADERS,
      getServiceRoleKey: () => 'service-secret',
      decodeWorksheet: (file) => {
        decodedFile = file;
        return Promise.resolve(emptyWorksheet);
      },
      createImportService: () => {
        serviceCreationCount += 1;
        return {
          import: (input) => {
            receivedInputs.push(input);
            return Promise.resolve({ writtenValeursCount: 3 });
          },
        };
      },
      reportError: () => undefined,
    });

    const response = await handler(
      makeMultipartRequest({ collectiviteId: '123', referentiel: 'eci' })
    );

    assert(response.status === 200, 'the authorized import should succeed');
    const responseBody = (await response.json()) as {
      success: boolean;
      writtenValeursCount: number;
    };
    assert(responseBody.success, 'success should be explicit');
    assert(
      responseBody.writtenValeursCount === 3,
      'the response should expose the effective write count'
    );
    assertCors(response);
    assert(
      decodedFile?.name === 'emt.xlsx',
      'the uploaded file should be decoded'
    );
    assert(serviceCreationCount === 1, 'the service should be created once');
    assert(receivedInputs.length === 1, 'one import should be requested');
    assert(
      receivedInputs[0]?.collectiviteId === 123,
      'the multipart collectivity identifier should be parsed'
    );
    assert(
      receivedInputs[0]?.referentiel === 'eci',
      'the multipart referential should be preserved'
    );
    assert(
      receivedInputs[0]?.worksheet === emptyWorksheet,
      'the decoded worksheet should cross the application boundary unchanged'
    );
  }
);

Deno.test('returns 500 and reports infrastructure failures', async () => {
  const errors: unknown[] = [];
  const databaseError = new Error('database unavailable');
  const handler = createImportEmtIndicateursHandler({
    corsHeaders: CORS_HEADERS,
    getServiceRoleKey: () => 'service-secret',
    decodeWorksheet: () => Promise.resolve(emptyWorksheet),
    createImportService: () => ({
      import: () => Promise.reject(databaseError),
    }),
    reportError: (error) => errors.push(error),
  });

  const response = await handler(makeMultipartRequest());
  const responseBody = (await response.json()) as {
    success: boolean;
    error: { code: string; message: string };
  };

  assert(response.status === 500, 'infrastructure failures should return 500');
  assert(!responseBody.success, 'the response should explicitly be a failure');
  assert(
    responseBody.error.code === 'EMT_IMPORT_FAILED',
    'infrastructure failures should have a stable error code'
  );
  assert(
    !responseBody.error.message.includes('database unavailable'),
    'internal infrastructure details should not be exposed'
  );
  assert(
    errors[0] === databaseError,
    'the original failure should be reported'
  );
  assertCors(response);
});
