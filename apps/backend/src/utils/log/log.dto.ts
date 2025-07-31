import { ApplicationContext } from '../context/application-context.dto';

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
