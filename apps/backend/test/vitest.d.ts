import 'vitest';
import type { CustomMatchers } from './vitest-matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
