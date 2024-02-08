'use server';

import {redirect} from 'next/navigation';
import {convertNameToSlug} from 'src/utils/convertNameToSlug';
import {getData} from './[slug]/utils';
import NotFound from '@components/info/NotFound';

/**
 * Permet la redirection vers la page article lorsque seul
 * l'ID est renseigné dans l'url
 */

const ArticleParId = async ({params}: {params: {id: string}}) => {
  const id = parseInt(params.id);
  const data = await getData(id);

  if (!data || !data.titre) return <NotFound />;
  redirect(`/actus/${params.id}/${convertNameToSlug(data.titre)}`);
};

export default ArticleParId;
