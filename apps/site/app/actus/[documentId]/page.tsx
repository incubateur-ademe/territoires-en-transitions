'use server';

import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getTitre, resolveActualiteDocumentId } from './[slug]/utils';

/**
 * Permet la redirection vers la page article lorsque seul
 * le documentId (ou l'ancien id numérique) est renseigné dans l'url
 */

const ArticleParId = async ({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) => {
  const resolved = await resolveActualiteDocumentId((await params).documentId);
  if (!resolved) return notFound();

  const titre = await getTitre(resolved.documentId);
  if (!titre) return notFound();

  const url = `/actus/${resolved.documentId}/${convertNameToSlug(titre)}`;
  if (resolved.isLegacyId) permanentRedirect(url);
  redirect(url);
};

export default ArticleParId;
