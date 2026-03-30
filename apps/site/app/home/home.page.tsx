'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '@/site/components/sections/Section';
import EmbededVideo from '@/site/components/video/EmbededVideo';
import AccueilHeroSection from './AccueilHeroSection';
import { BeneficesPlateforme } from './BeneficesPlateforme';
import { ConstructionPlateforme } from './ConstructionPlateforme';
import { HomeCTA } from './HomeCTA';
import { HomeCTA2 } from './HomeCTA2';
import { NosServices } from './NosServices';
import { Partenaires } from './Partenaires';
import { StatsHeroSection } from './StatsHeroSection';
import Temoignages from './Temoignages';
import { getData } from './utils';

export const HomePage = async () => {
  const data = await getData();

  if (!data) {
    return <NoResult />;
  }

  return (
    <>
      <AccueilHeroSection />
      <Section>
        <EmbededVideo
          url="https://www.youtube.com/embed/fFyxb7M4Wio"
          className="xl:w-4/6 lg:w-4/5"
        />
      </Section>

      <StatsHeroSection />

      <BeneficesPlateforme />

      <Partenaires />

      <HomeCTA />

      <NosServices />

      {data.temoignages && <Temoignages {...data.temoignages} />}

      <ConstructionPlateforme />

      <HomeCTA2 />
    </>
  );
};
