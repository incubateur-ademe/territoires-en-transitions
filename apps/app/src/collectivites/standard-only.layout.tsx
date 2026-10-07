import { getCollectivite } from '@tet/api/collectivites/index.server';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import z from 'zod';

/**
 * Layout réservé aux collectivités « standard » : un service déconcentré n'a rien
 * à voir dans ces routes.
 *
 * La réponse est un 404 et non un refus d'accès : ces espaces n'existent pas
 * pour un service de l'État — il n'a ni plans, ni référentiels, ni état des
 * lieux — et ce n'est donc pas une question de droits. Dire « vous n'avez pas
 * les permissions » laisserait croire à une page qu'un autre compte pourrait
 * voir, alors qu'il n'y a rien derrière, pour personne.
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
    notFound();
  }

  return children;
}
