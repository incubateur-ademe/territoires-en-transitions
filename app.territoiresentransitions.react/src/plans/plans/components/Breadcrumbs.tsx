'use client';
import dynamic from 'next/dynamic';

/**
 * Breadcrumbs utilise `Button` qui ne fonctionne que côté client.
 * Le composant `Button` est à challenger pour pouvoir tolérer le server-side.
 */
export const Breadcrumbs = dynamic(
  () =>
    import('@/ui/design-system/Breadcrumbs').then(
      (module) => module.Breadcrumbs
    ),
  {
    ssr: false,
  }
);
