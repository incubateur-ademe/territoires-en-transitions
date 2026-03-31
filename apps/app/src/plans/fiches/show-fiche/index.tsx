'use client';

import { FicheWithRelations } from '@tet/domain/plans';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { FicheView } from './fiche.view';

type FichePageProps = {
  fiche: FicheWithRelations;
  children?: React.ReactNode;
};

export const Fiche = ({ fiche, children }: FichePageProps) => {
  const [params] = useQueryStates({ planId: parseAsInteger });
  const planId = params.planId || undefined;

  return (
    <FicheView fiche={fiche} planId={planId}>
      {children}
    </FicheView>
  );
};
