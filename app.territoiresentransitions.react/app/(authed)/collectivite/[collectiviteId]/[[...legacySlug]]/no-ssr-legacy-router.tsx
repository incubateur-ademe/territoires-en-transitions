'use client';
import dynamic from 'next/dynamic';

export const NoSsrLegacyRouter = dynamic(
  () =>
    import('./legacy-router').then((module) => ({
      default: module.LegacyRouter,
    })),
  {
    ssr: false,
  }
);
