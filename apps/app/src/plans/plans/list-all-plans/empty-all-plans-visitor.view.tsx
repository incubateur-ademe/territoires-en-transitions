'use client';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { EmptyCard } from '@tet/ui';

export const EmptyAllPlansVisitorView = () => {
  return (
    <EmptyCard
      picto={() => <PictoDashboard height="160" width="160" />}
      title="Cette collectivité n'a pas encore de plan"
    />
  );
};
