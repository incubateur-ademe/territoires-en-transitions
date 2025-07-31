'use client';

import { Button } from '@/ui';
import { useEffect } from 'react';

const Error = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    // Optionally log the error
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col gap-6 items-center justify-center my-16">
      <h2 className="text-center text-lg font-normal">
        Une erreur est survenue lors du chargement de la page...
      </h2>
      <Button
        size="sm"
        onClick={
          // Attempt to recover by trying to re-render
          () => reset()
        }
      >
        Réessayer
      </Button>
    </main>
  );
};

export default Error;
