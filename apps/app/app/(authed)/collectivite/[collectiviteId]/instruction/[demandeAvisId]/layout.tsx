import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { ReactNode } from 'react';
import z from 'zod';

/**
 * Le dossier vit sous la collectivité **instruite**, dont l'agent n'est pas
 * membre : ni la garde des routes standard ni celle de l'espace d'instruction ne
 * conviennent ici. C'est la saisine qui ouvre la route, et elle doit être celle
 * de l'utilisateur *et* porter sur la collectivité de l'URL — sinon une URL
 * forgée afficherait un dossier sous le nom d'une autre collectivité.
 *
 * Le contexte lu est celui que le layout de collectivité a résolu et que la
 * bannière affiche : une seule valeur, donc pas de contradiction possible.
 */
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; demandeAvisId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demandeAvisId: unsafeDemande } =
    await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);
  const demandeAvisId = z.coerce.number().parse(unsafeDemande);

  const { contexteInstruction } = await getCollectivite(
    collectiviteId,
    demandeAvisId
  );

  if (contexteInstruction?.demandeAvisId !== demandeAvisId) {
    return (
      <ErreurAccesPage
        dashboardHref={makeTdbCollectiviteUrl({ collectiviteId })}
      />
    );
  }

  return children;
}
