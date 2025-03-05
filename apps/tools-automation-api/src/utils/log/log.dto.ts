import { ApplicationContext } from 'apps/tools-automation-api/src/utils/log/application-context.dto';

/**
 *
 */
export interface Log extends ApplicationContext {
  message?: string;

  /**
   * Use snake_case to match datadoq reserved attributes
   */
  trace_id?: string;
}
