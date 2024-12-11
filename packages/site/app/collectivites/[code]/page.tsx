'use server';

import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { fetchCollectivite } from '../utils';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

/**
 * Permet la redirection vers la page collectivité lorsque seul
 * le code SIREN / INSEE est renseigné dans l'url
 */

const DetailCodeCollectivite = async ({
  params,
}: {
  params: { code: string };
}) => {
  const data = await fetchCollectivite(params.code);

  if (!data) return notFound();

  redirect(
    `/collectivites/${params.code}/${convertNameToSlug(
      data?.collectivite.nom ?? ''
    )}`
  );
};

export default DetailCodeCollectivite;
