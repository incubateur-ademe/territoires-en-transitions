import { ApplicationContext } from '../context/application-context.dto';

/**
 *
 */
export interface Log extends ApplicationContext {
  message?: string;

  // Error stack
  stack?: string;
}
