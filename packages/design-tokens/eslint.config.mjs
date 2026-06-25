import { frontendLuxonImportBan } from '../../eslint-frontend.config.mjs';
import baseConfig from '../../eslint.config.mjs';

export default [...baseConfig, frontendLuxonImportBan()];
