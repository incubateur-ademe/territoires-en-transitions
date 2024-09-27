'use server';

import Section from '@tet/site/components/sections/Section';
import Fonctionnement from './Fonctionnement';
import Principes from './Principes';
import ChiffresClefs from './ChiffresClefs';
import BudgetConsomme from './BudgetConsomme';
import PerformanceBudget from './PerformanceBudget';
import { getStrapiData } from './utils';
import NoResult from '@tet/site/components/info/NoResult';
import { Metadata, ResolvingMetadata } from 'next';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';

export async function generateMetadata(
  { params }: { params: unknown },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Budget',
    networkTitle: strapiData?.seo.metaTitle,
    description:
      strapiData?.seo.metaDescription ?? strapiData?.header.description,
    image: strapiData?.seo.metaImage,
  });
}

const Budget = async () => {
  const strapiData = await getStrapiData();

  return strapiData ? (
    <Section
      containerClassName="grow max-md:!pb-0 bg-primary-1 "
      className="max-md:px-0 !gap-0"
    >
      <div className="max-md:px-6 mb-6">
        <h1 className="text-primary-10 text-[25px] mb-4">
          {strapiData.header.titre_secondaire}
        </h1>
        <h2 className="text-primary-7 text-[42px] md:text-[53px] max-md:leading-[50px] mb-8">
          {strapiData.header.titre_principal}
        </h2>
        <p className="text-primary-10 text-[18px] font-bold mb-10">
          {strapiData.header.description}
        </p>
      </div>

      <div className="grid grid-cols-3 md:gap-10">
        <div className="col-span-full lg:col-span-2 flex flex-col md:gap-10">
          <BudgetConsomme {...strapiData.budgetConsomme} />
          <PerformanceBudget {...strapiData.performanceBudget} />
        </div>

        <div className="max-lg:order-first col-span-full lg:col-span-1 flex flex-col md:gap-10">
          <Fonctionnement {...strapiData.fonctionnement} />
          <Principes {...strapiData.principes} />
          <ChiffresClefs />
        </div>
      </div>
    </Section>
  ) : (
    <NoResult />
  );
};

export default Budget;
