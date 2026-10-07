'use client';

import Section from '@/site/components/sections/Section';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { StrapiMedia } from '@/site/src/strapi/types';
import { Button } from '@tet/ui';

type HeaderTrajectoireProps = {
  titre: string;
  couverture: StrapiMedia;
  ctaConnexion: string;
};

const HeaderTrajectoire = ({
  titre,
  couverture,
  ctaConnexion,
}: HeaderTrajectoireProps) => {
  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <h1 className="text-center text-primary-10">{titre}</h1>
      <StrapiImage
        media={couverture}
        sizes="(min-width: 1440px) 1392px, 100vw"
        className="max-h-[560px]"
        containerClassName="mx-auto h-fit"
        priority
      />
      <Button
        href="https://app.territoiresentransitions.fr/"
        className="mx-auto"
        external
      >
        {ctaConnexion}
      </Button>
    </Section>
  );
};

export default HeaderTrajectoire;
