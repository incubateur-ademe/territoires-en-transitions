'use client';

import { useUser } from "@/api/users/user-provider";
import { useCurrentCollectivite } from "@/app/core-logic/hooks/useCurrentCollectivite";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const collectivite = useCurrentCollectivite();

  const user = useUser();

  if (!collectivite?.collectiviteId) return <></>;

  /** Vérifie que l'utilisateur peut accéder à la collectivité */
  const hasNoAccessToCollectivite =
    collectivite.accesRestreint &&
    collectivite.niveauAcces === null &&
    !user?.isSupport &&
    !collectivite.isRoleAuditeur;

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
