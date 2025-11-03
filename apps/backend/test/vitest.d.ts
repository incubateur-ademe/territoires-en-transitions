import 'vitest';
import type { CustomMatchers } from './vitest-matchers';

declare module 'vitest' {
  type Assertion<T = any> = CustomMatchers<T>;

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers<T> {}
}
