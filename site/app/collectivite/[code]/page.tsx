'use server';

import {redirect} from 'next/navigation';
import {convertNameToSlug} from 'app/utils';
import {Metadata} from 'next';
import {supabase} from 'app/initSupabase';

const fetchCollectiviteName = async (code_siren_insee: string) => {
  const {data, error} = await supabase
    .from('site_labellisation')
    .select('nom')
    .match({code_siren_insee});

  if (error) {
    throw new Error(`site_labellisation-${code_siren_insee}`);
  }
  if (!data || !data.length) {
    return null;
  }

  return data[0].nom;
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
  const nom = await fetchCollectiviteName(params.code);

  redirect(`/collectivite/${params.code}/${convertNameToSlug(nom ?? '')}`);
};

export default DetailCodeCollectivite;
