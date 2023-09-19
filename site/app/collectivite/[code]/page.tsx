'use client';

import {useRouter} from 'next/navigation';
import {convertNameToSlug} from 'app/utils';
import {useCollectivite} from './[name]/useCollectivite';

/**
 * Permet la redirection vers la page collectivité lorsque seul
 * le code SIREN / INSEE est renseigné dans l'url
 */

const DetailCodeCollectivite = ({params}: {params: {code: string}}) => {
  const router = useRouter();
  const {data} = useCollectivite(params.code);

  router.push(
    `/collectivite/${params.code}/${convertNameToSlug(
      data && data[0].nom ? data[0].nom : '',
    )}`,
  );
};

export default DetailCodeCollectivite;
