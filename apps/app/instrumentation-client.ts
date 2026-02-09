import {
  captureRouterTransitionStart,
  initSentry,
} from './src/utils/sentry/sentry-client.lazy';

initSentry();

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  captureRouterTransitionStart(url, navigationType);
}
