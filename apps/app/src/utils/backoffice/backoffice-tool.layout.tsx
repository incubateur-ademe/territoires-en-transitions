import { getUser } from '@tet/api/users/user-details.fetch.server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { BackofficeToolId, isBackofficeToolAllowed } from './backoffice-tools';

/**
 * Layout d'un outil de l'espace Administration : la page n'existe que pour qui
 * a la permission de l'outil, déclarée une seule fois dans `backoffice-tools`.
 * Le layout de `/admin` ne vérifie que l'accès à au moins un outil.
 *
 * Réexporté comme `layout.tsx` par le segment de chaque outil :
 * `export default makeBackofficeToolLayout('banniere');`
 */
export const makeBackofficeToolLayout = (id: BackofficeToolId) =>
  async function BackofficeToolLayout({ children }: { children: ReactNode }) {
    const user = await getUser();
    if (!isBackofficeToolAllowed(user, id)) {
      notFound();
    }
    return children;
  };
