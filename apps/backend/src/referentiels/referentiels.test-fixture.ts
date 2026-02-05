import { withOnTestFinished } from '../utils/test-fixture.utils';
import { createAudit } from './labellisations/labellisations.test-fixture';

export const createAuditWithOnTestFinished = withOnTestFinished(createAudit);
