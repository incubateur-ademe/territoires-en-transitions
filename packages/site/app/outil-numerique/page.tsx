'use server';

import NoResult from '@components/info/NoResult';
import AvantagesPlateforme from './AvantagesPlateforme';
import EquipePlateforme from './EquipePlateforme';
import HeaderPlateforme from './HeaderPlateforme';
import QuestionsPlateforme from './QuestionsPlateforme';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import {getStrapiData} from './utils';
import {Metadata, ResolvingMetadata} from 'next';
import {getUpdatedMetadata} from 'src/utils/getUpdatedMetadata';
import PanierActionsImpact from './PanierActionsImpact';

export async function generateMetadata(
  {params}: {params: {}},
  parent: ResolvingMetadata,
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

  return strapiData && strapiData.avantages.length > 0 ? (
    <div className="grow">
      <HeaderPlateforme {...strapiData.header} />

      <AvantagesPlateforme avantages={strapiData.avantages} />

      <PanierActionsImpact {...strapiData.panier} />

      {strapiData.temoignages.length > 0 && (
        <TemoignagesPlateforme temoignages={strapiData.temoignages} />
      )}

      <EquipePlateforme {...strapiData.equipe} />

      <QuestionsPlateforme {...strapiData.questions} />
    </div>
  ) : (
    <NoResult />
  );
};

export default OutilNumerique;
