import type { DecodeEmtWorksheet } from './emt-workbook.adapter.ts';
import type {
  ImportEmtIndicateursInput,
  ImportEmtIndicateursResult,
} from './import-emt-indicateurs.service.ts';
import {
  asInvalidEmtImportError,
  InvalidEmtImportError,
} from './import-emt-indicateurs.error.ts';

type ImportEmtIndicateursPort = Readonly<{
  import: (
    input: ImportEmtIndicateursInput
  ) => Promise<ImportEmtIndicateursResult>;
}>;

type ImportEmtIndicateursHandlerDependencies = Readonly<{
  corsHeaders: HeadersInit;
  getServiceRoleKey: () => string | undefined;
  decodeWorksheet: DecodeEmtWorksheet;
  createImportService: () => ImportEmtIndicateursPort;
  reportError: (error: unknown) => void;
}>;

const jsonResponse = (
  body: unknown,
  status: number,
  corsHeaders: HeadersInit,
  additionalHeaders?: HeadersInit
): Response => {
  const headers = new Headers(corsHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  for (const [name, value] of new Headers(additionalHeaders)) {
    headers.set(name, value);
  }
  return Response.json(body, { status, headers });
};

/** HTTP adapter kept independent from Deno.serve and concrete infrastructure. */
export const createImportEmtIndicateursHandler =
  ({
    corsHeaders,
    getServiceRoleKey,
    decodeWorksheet,
    createImportService,
    reportError,
  }: ImportEmtIndicateursHandlerDependencies) =>
  async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Méthode non autorisée',
          },
        },
        405,
        corsHeaders,
        { allow: 'OPTIONS, POST' }
      );
    }

    const serviceRoleKey = getServiceRoleKey();
    if (
      !serviceRoleKey ||
      request.headers.get('authorization') !== `Bearer ${serviceRoleKey}`
    ) {
      return new Response('Execute access forbidden', {
        headers: corsHeaders,
        status: 403,
      });
    }

    try {
      let data: FormData;
      try {
        data = await request.formData();
      } catch (error) {
        throw asInvalidEmtImportError(
          error,
          'La requête doit être envoyée au format multipart/form-data'
        );
      }
      const collectiviteId = Number(data.get('collectivite_id'));
      const referentiel = String(data.get('referentiel') ?? '');
      const file = data.get('file');
      if (!(file instanceof File)) {
        throw new InvalidEmtImportError('Le fichier EMT est obligatoire');
      }

      let worksheet: Awaited<ReturnType<DecodeEmtWorksheet>>;
      try {
        worksheet = await decodeWorksheet(file);
      } catch (error) {
        throw asInvalidEmtImportError(
          error,
          'Le fichier EMT ne peut pas être lu'
        );
      }
      const result = await createImportService().import({
        collectiviteId,
        referentiel,
        worksheet,
      });

      return jsonResponse({ success: true, ...result }, 200, corsHeaders);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof InvalidEmtImportError) {
        return jsonResponse(
          { success: false, error: { code: 'INVALID_EMT_IMPORT', message } },
          422,
          corsHeaders
        );
      }

      reportError(error);
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'EMT_IMPORT_FAILED',
            message: "L'import EMT a échoué",
          },
        },
        500,
        corsHeaders
      );
    }
  };
