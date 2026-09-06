import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClientWithServiceRole } from '../_shared/getSupabaseClient.ts';
import * as xlsx from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import * as cptable from 'https://deno.land/x/sheetjs@v0.18.3/dist/cpexcel.full.mjs';
import { EmtIndicateurRepository } from './emt-indicateur.repository.ts';
import { createEmtWorksheetDecoder } from './emt-workbook.adapter.ts';
import { createImportEmtIndicateursHandler } from './import-emt-indicateurs.handler.ts';
import { ImportEmtIndicateursService } from './import-emt-indicateurs.service.ts';

xlsx.set_cptable(cptable);

/**
 * Import (xlsx) des indicateurs EMT
 */
const decodeWorksheet = createEmtWorksheetDecoder(xlsx);

serve(
  createImportEmtIndicateursHandler({
    corsHeaders,
    getServiceRoleKey: () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    decodeWorksheet,
    createImportService: () =>
      new ImportEmtIndicateursService(
        new EmtIndicateurRepository(getSupabaseClientWithServiceRole())
      ),
    reportError: (error) => console.error(error),
  })
);
