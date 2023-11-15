'use server';

import {redirect} from 'next/navigation';
import {Metadata} from 'next';
import {fetchCollectivite} from '../utils';
import {convertNameToSlug} from 'src/utils/convertNameToSlug';

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

  redirect(
    `/collectivites/${params.code}/${convertNameToSlug(data?.nom ?? '')}`,
  );
};

export default DetailCodeCollectivite;
