'use server';

import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import ProgrammeBanner from './ProgrammeBanner';
import NoResult from '@components/info/NoResult';
import {getStrapiData} from './utils';
import {Metadata, ResolvingMetadata} from 'next';
import {getUpdatedMetadata} from 'src/utils/getUpdatedMetadata';
import Contact from './Contact';
import Compte from './Compte';
import CollectivitesEngagees from './CollectivitesEngagees';

export async function generateMetadata(
  params: {params: {}},
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Programme',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription ?? strapiData?.description,
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
      />

      <Benefices
        titre={data.benefices.titre}
        description={data.benefices.description}
        contenu={data.benefices.contenu}
      />

      <Contact
        description="Vous souhaitez en savoir plus sur le programme Territoire Engagé Transition Écologique"
        cta="Contactez-nous"
      />

      <Etapes
        titre={data.etapes.titre}
        description={data.etapes.description}
        contenu={data.etapes.contenu}
      />

      <Services titre={data.services.titre} contenu={data.services.contenu} />

      <CollectivitesEngagees />

      <Compte
        titre="Créer un compte gratuitement sur notre service numérique"
        description={data.compte.description}
        cta="Créer un compte"
        image={
          data.services.contenu ? data.services.contenu[0].image : undefined
        }
      />
    </>
  ) : (
    <NoResult />
  );
};

export default Programme;
