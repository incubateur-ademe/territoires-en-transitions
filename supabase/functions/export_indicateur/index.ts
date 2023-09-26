import { serveExportFunction } from '../_shared/serveUtils.ts';
import { exportXLSX } from './exportXLSX.ts';
import { TExportArgs } from './types.ts';

serveExportFunction((supabaseClient, args) =>
  exportXLSX(supabaseClient, args as TExportArgs)
);
