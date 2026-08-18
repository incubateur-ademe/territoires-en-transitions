import { makeDemandesAvisUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { ReactNode } from 'react';
import z from 'zod';

/**
 * Layout réservé aux collectivités « standard » : un service déconcentré n'a rien
 * à voir dans ces routes et repart vers son espace d'instruction.
 *
 * Réexporté tel quel comme `layout.tsx` par chaque segment de premier niveau sous
 * `[collectiviteId]` — il n'y a pas de groupe `(standard)` qui les rassemblerait.
 * `routes-gating.spec.ts` vérifie qu'aucun segment n'échappe à cette garde.
 */
export default async function StandardOnlyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const collectivite = await getCollectivite(collectiviteId);

  if (isServiceDeconcentre(collectivite.collectiviteType)) {
    return (
      <ErreurAccesPage
        dashboardHref={makeDemandesAvisUrl({ collectiviteId })}
      />
    );
  }

  return children;
}
