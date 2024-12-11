'use server';

import { TrackPageView } from '@/ui';
import Trajectoire from '@tet/site/app/outil-numerique/Trajectoire';
import NoResult from '@tet/site/components/info/NoResult';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import AvantagesPlateforme from './AvantagesPlateforme';
import EquipePlateforme from './EquipePlateforme';
import HeaderPlateforme from './HeaderPlateforme';
import PanierActionsImpact from './PanierActionsImpact';
import QuestionsPlateforme from './QuestionsPlateforme';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import { getStrapiData } from './utils';

export async function generateMetadata(
  { params }: { params: unknown },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Outil numérique',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription ?? strapiData?.header.accroche,
    image: strapiData?.seo.metaImage,
  });
}

const OutilNumerique = async () => {
  const strapiData = await getStrapiData();

  return (
    <>
      <TrackPageView pageName={'site/outil-numerique'} properties={{}} />

      {strapiData ? (
        <div className="grow">
          <HeaderPlateforme {...strapiData.header} />

          <AvantagesPlateforme avantages={strapiData.avantages} />

          <PanierActionsImpact {...strapiData.panier} />

          <Trajectoire {...strapiData.trajectoire} />

          {strapiData.temoignages.length > 0 && (
            <TemoignagesPlateforme temoignages={strapiData.temoignages} />
          )}

          <EquipePlateforme {...strapiData.equipe} />

          <QuestionsPlateforme {...strapiData.questions} />
        </div>
      ) : (
        <NoResult />
      )}
    </>
  );
};

export default OutilNumerique;
