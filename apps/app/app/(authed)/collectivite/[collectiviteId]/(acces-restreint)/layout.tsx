'use client';

import { ReactNode } from 'react';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export default function Layout({ children }: { children: ReactNode }) {
  const collectivite = useCurrentCollectivite();

  const isVisitor = useIsVisitor();

  /** Vérifie que l'utilisateur peut accéder à la collectivité */
  const hasNoAccessToCollectivite = collectivite.accesRestreint && isVisitor;

  /** S'il ne peut pas, on affiche un message */
  if (hasNoAccessToCollectivite) {
    return (
      <div className="flex-grow flex">
        <div className="m-auto text-grey-7">
          Cette collectivité n’est pas accessible en mode visite.
        </div>
      </div>
    );
  }

  return children;
}
