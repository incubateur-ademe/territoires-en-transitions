'use client'; // Error boundaries must be Client Components

import { ErrorPage } from '@/app/utils/error/error.page';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} retry={reset} />;
}
