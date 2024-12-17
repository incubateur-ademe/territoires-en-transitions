import 'vitest';
import type { CustomMatchers } from './vitest-matchers';

declare module 'vitest' {
  type Assertion<T> = CustomMatchers<T>;
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
