'use client';

import { appLabels } from '@/app/labels/catalog';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReactNode } from 'react';

export const AccesRestreintGuard = ({ children }: { children: ReactNode }) => {
  const collectivite = useCurrentCollectivite();
  const isVisitor = useIsVisitor();

  if (collectivite.accesRestreint && isVisitor) {
    return (
      <div className="flex-grow flex">
        <div className="m-auto text-grey-7">
          {appLabels.collectiviteInaccessibleEnVisite}
        </div>
      </div>
    );
  }

  return children;
};
