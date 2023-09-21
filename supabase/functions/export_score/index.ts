import { serveExportFunction } from '../_shared/serveUtils.ts';
import { exportXLSX, TExportArgs } from './exportXLSX.ts';

serveExportFunction((supabaseClient, args) =>
  exportXLSX(supabaseClient, args as TExportArgs)
);
