import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getContexteInstructionPourDemande } from '@tet/api/collectivites/index.server';
import { ReactNode } from 'react';
import z from 'zod';

/**
 * Le dossier d'instruction vit sous la collectivité **instruite** : l'ouvrir
 * bascule le contexte sur la déposante, alors que l'agent n'en est pas membre.
 *
 * D'où une garde à part, ni celle des routes standard (une collectivité
 * instruite est une collectivité ordinaire, elle ne doit pas être écartée) ni
 * celle de l'espace d'instruction (qui exige d'être membre du service). Ce qui
 * ouvre cette route, c'est la **saisine** de l'URL, résolue côté serveur : elle
 * doit être celle de l'utilisateur *et* porter sur la collectivité de l'URL —
 * sans ce second contrôle, une URL forgée afficherait le dossier d'une
 * collectivité sous le nom d'une autre.
 *
 * La saisine par défaut portée par le contexte de collectivité ne suffirait pas
 * ici : c'est la plus récente, et s'y fier refuserait tout dossier plus ancien.
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

  const contexte = await getContexteInstructionPourDemande({
    collectiviteId,
    demandeAvisId,
  });

  if (contexte === null) {
    return (
      <ErreurAccesPage
        dashboardHref={makeTdbCollectiviteUrl({ collectiviteId })}
      />
    );
  }

  return children;
}
