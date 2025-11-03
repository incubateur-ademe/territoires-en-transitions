'use server';

import Trajectoire from '@/site/app/outil-numerique/Trajectoire';
import NoResult from '@/site/components/info/NoResult';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import AvantagesPlateforme from './AvantagesPlateforme';
import EquipePlateforme from './EquipePlateforme';
import HeaderPlateforme from './HeaderPlateforme';
import PanierActionsImpact from './PanierActionsImpact';
import QuestionsPlateforme from './QuestionsPlateforme';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import { getStrapiData } from './utils';

export async function generateMetadata(
  _: { params: Promise<unknown> },
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
  const data = await getStrapiData();

  if (!data) {
    return <NoResult />;
  }
  return (
    <div className="grow">
      <HeaderPlateforme {...data.header} />

      <AvantagesPlateforme avantages={data.avantages} />

      <PanierActionsImpact {...data.panier} />

      <Trajectoire {...data.trajectoire} />

      {data.temoignages.length > 0 && (
        <TemoignagesPlateforme temoignages={data.temoignages} />
      )}

      <EquipePlateforme {...data.equipe} />

      <QuestionsPlateforme {...data.questions} />
    </div>
  );
};

export default OutilNumerique;
