'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  getRechercheViewUrl,
  makeRejoindreCollectiviteUrl,
  RecherchesViewParam,
} from '@/app/app/paths';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { Alert, Button } from '@tet/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Recherches hors collectivité : réservées aux utilisateurs membres d'aucune
 * collectivité. Un membre est renvoyé vers la même vue, dans le contexte de sa
 * collectivité courante (cartes cliquables, pas de bandeau « rejoindre »).
 * Le support, les super-admins et l'ADEME voient les contacts sans être
 * membres : pas de bandeau pour eux non plus.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const { collectiviteId: currentCollectiviteId } = useCollectiviteContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Les entrées sans rôle (auditeur seulement) ne valent pas appartenance.
  const memberships = user.collectivites.filter((c) => c.role !== null);
  const memberCollectiviteId =
    memberships.find((c) => c.collectiviteId === currentCollectiviteId)
      ?.collectiviteId ?? memberships[0]?.collectiviteId;
  // Un membre non vérifié verrait `UnverifiedUserCard` dans la vue liée à sa
  // collectivité : il reste sur la vue hors collectivité.
  const redirectCollectiviteId = hasRole(user, PlatformRole.VERIFIED)
    ? memberCollectiviteId
    : undefined;

  useEffect(() => {
    if (redirectCollectiviteId === undefined) return;
    const view = pathname
      .split('/')
      .filter(Boolean)
      .at(-1) as RecherchesViewParam;
    const query = searchParams.toString();
    router.replace(
      `${getRechercheViewUrl({
        collectiviteId: redirectCollectiviteId,
        view,
      })}${query ? `?${query}` : ''}`
    );
  }, [redirectCollectiviteId, pathname, searchParams, router]);

  if (redirectCollectiviteId !== undefined) {
    return null;
  }

  const hasPlatformAccess = [
    PlatformRole.SUPPORT,
    PlatformRole.SUPER_ADMIN,
    PlatformRole.ADEME,
  ].some((role) => hasRole(user, role));
  if (memberCollectiviteId !== undefined || hasPlatformAccess) {
    return children;
  }

  return (
    <>
      <Alert
        state="info"
        title="Pour accéder à plus de détails sur chacune des collectivités engagées dans le programme, vous devez être membre d’au moins une collectivité."
        className="mb-10"
        footer={
          <Button
            dataTest="btn-AssocierCollectivite"
            size="xs"
            href={makeRejoindreCollectiviteUrl()}
          >
            {appLabels.rejoindreUneCollectivite}
          </Button>
        }
      />
      {children}
    </>
  );
}
