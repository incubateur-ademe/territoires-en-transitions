import { captureRouterTransitionStartSafe } from '@/api/utils/error-reporting';

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = captureRouterTransitionStartSafe;
