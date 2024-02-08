'use server';

import {redirect} from 'next/navigation';
import {Metadata} from 'next';
import {fetchCollectivite} from '../utils';
import {convertNameToSlug} from 'src/utils/convertNameToSlug';
import NotFound from '@components/info/NotFound';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

/**
 * Permet la redirection vers la page collectivité lorsque seul
 * le code SIREN / INSEE est renseigné dans l'url
 */

const DetailCodeCollectivite = async ({params}: {params: {code: string}}) => {
  const data = await fetchCollectivite(params.code);

  if (!data) return <NotFound />;

  redirect(
    `/collectivites/${params.code}/${convertNameToSlug(
      data?.collectivite.nom ?? '',
    )}`,
  );
};

export default DetailCodeCollectivite;
