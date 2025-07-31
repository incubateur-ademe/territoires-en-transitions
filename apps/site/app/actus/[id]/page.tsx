'use server';

import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { notFound, redirect } from 'next/navigation';
import { getData } from './[slug]/utils';

/**
 * Permet la redirection vers la page article lorsque seul
 * l'ID est renseigné dans l'url
 */

const ArticleParId = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const id = parseInt((await params).id);
  const data = await getData(id);

  if (!data || !data.titre) return notFound();
  redirect(`/actus/${id}/${convertNameToSlug(data.titre)}`);
};

export default ArticleParId;
