'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '@/site/components/sections/Section';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import BudgetConsomme from './BudgetConsomme';
import ChiffresClefs from './ChiffresClefs';
import Fonctionnement from './Fonctionnement';
import PerformanceBudget from './PerformanceBudget';
import Principes from './Principes';
import { getStrapiData } from './utils';

export async function generateMetadata(
  { params }: { params: Promise<unknown> },
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
        <h2 className="text-primary-10 text-2xl mb-3">
          {strapiData.header.titre_secondaire}
        </h2>
        <h1 className="text-primary-7 text-[2.625rem] md:text-5xl max-md:leading-[3rem] mb-8">
          {strapiData.header.titre_principal}
        </h1>
        <p className="text-primary-10 text-lg font-bold mb-10">
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
