'use server';

import {redirect} from 'next/navigation';
import {convertNameToSlug} from 'app/utils';
import {Metadata} from 'next';
import {supabase} from 'app/initSupabase';

export const fetchCollectivite = async (code_siren_insee: string) => {
  const {data, error} = await supabase
    .from('site_labellisation')
    .select()
    .match({code_siren_insee});

  if (error) {
    throw new Error(`site_labellisation-${code_siren_insee}`);
  }
  if (!data || !data.length) {
    return null;
  }

  return data[0];
};

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
    `/collectivite/${params.code}/${convertNameToSlug(data?.nom ?? '')}`,
  );
};

export default DetailCodeCollectivite;
