'use server';

import { notFound, redirect } from 'next/navigation';
import { convertNameToSlug } from '@tet/site/src/utils/convertNameToSlug';
import { getData } from './[slug]/utils';

/**
 * Permet la redirection vers la page article lorsque seul
 * l'ID est renseigné dans l'url
 */

const ArticleParId = async ({ params }: { params: { id: string } }) => {
  const id = parseInt(params.id);
  const data = await getData(id);

  if (!data || !data.titre) return notFound();
  redirect(`/actus/${params.id}/${convertNameToSlug(data.titre)}`);
};

export default ArticleParId;
