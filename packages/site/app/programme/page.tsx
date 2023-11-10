'use server';

import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import ProgrammeBanner from './ProgrammeBanner';
import Compte from './Compte';
import Ressources from './Ressources';
import NoResult from '@components/info/NoResult';
import {getStrapiData} from './utils';
import Carte from './Carte';
import {Metadata, ResolvingMetadata} from 'next';
import {getUpdatedMetadata} from 'src/utils/getUpdatedMetadata';

export async function generateMetadata(
  params: {params: {}},
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Le programme',
    description: strapiData?.seo.metaDescription,
    image: strapiData?.seo.metaImage,
  });
}

const Programme = async () => {
  const data = await getStrapiData();

  return data ? (
    <>
      <ProgrammeBanner
        titre={data.titre}
        description={data.description}
        couvertureURL={data.couvertureURL}
        objectifs={data.objectifs}
      />

      <Services
        titre={data.services.titre}
        description={data.services.description}
        contenu={data.services.contenu}
      />

      <Compte description={data.compte.description} />

      <Benefices
        titre={data.benefices.titre}
        description={data.benefices.description}
        contenu={data.benefices.contenu}
      />

      <Etapes
        titre={data.etapes.titre}
        description={data.etapes.description}
        contenu={data.etapes.contenu}
      />

      <Carte />

      <Ressources
        description={data.ressources.description}
        buttons={data.ressources.buttons}
      />
    </>
  ) : (
    <NoResult />
  );
};

export default Programme;
