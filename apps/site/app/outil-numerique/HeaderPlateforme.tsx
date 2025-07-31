'use client';

import { useEvolutionTotalActivation } from '@/site/app/stats/EvolutionTotalActivationParType';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { Button } from '@/ui';
import posthog from 'posthog-js';
import Arrow from './Arrow';

type HeaderPlateformeProps = {
  titre: string;
  accroche: string;
  cta_inscription: string;
  url_inscription: string;
  cta_demo: string;
  url_demo: string;
  couverture: StrapiItem;
};

const HeaderPlateforme = ({
  titre,
  accroche,
  cta_inscription,
  url_inscription,
  cta_demo,
  url_demo,
  couverture,
}: HeaderPlateformeProps) => {
  const { data } = useEvolutionTotalActivation('', '');
  const collectivitesActivees = data ? data.courant.total : undefined;

  return (
    <Section containerClassName="bg-gradient-to-b from-[#F4F5FD] to-[#FFFFFF] !pb-0">
      <h1 className="text-primary-9 text-center md:text-[45px] md:leading-[55px] lg:px-20 mb-2">
        {titre}
      </h1>
      <p className="text-primary-7 text-center text-[22px] leading-[28px] md:text-[24px] md:leading-[32px] font-bold lg:px-20 mb-4">
        {accroche}
      </p>
      <div className="flex max-md:flex-col gap-y-4 gap-x-8 justify-center items-center">
        <div className="max-md:flex max-md:flex-col max-md:items-center">
          <Button
            href={url_inscription}
            onClick={() => posthog.capture('inscription_plateforme')}
          >
            {cta_inscription}
          </Button>
          {!!collectivitesActivees && (
            <p className="md:hidden text-primary-9 text-[13px] font-bold mb-0 pt-2">
              Déjà {collectivitesActivees} collectivités utilisatrices
            </p>
          )}
        </div>

        <Button
          href={url_demo}
          onClick={() => posthog.capture('inscription_demo')}
          variant="outlined"
          icon="play-circle-line"
        >
          {cta_demo}
        </Button>
      </div>
      <div className="max-md:hidden flex justify-center gap-4 h-[32px] mt-2">
        {!!collectivitesActivees && (
          <>
            <Arrow />
            <p className="text-primary-9 text-[13px] font-bold mb-0 pt-2">
              Déjà {collectivitesActivees} collectivités utilisatrices
            </p>
          </>
        )}
      </div>

      <DEPRECATED_StrapiImage
        data={couverture}
        className="max-h-[560px] w-full object-cover object-top"
        containerClassName="max-h-[560px] min-w-[350px] md:w-4/5 w-fit mx-auto mt-8 rounded-t-[30px] overflow-hidden border-t border-l border-r border-primary-4"
        containerStyle={{ boxShadow: '0px 4px 50px 0px #0000000D' }}
        displayCaption={false}
      />
    </Section>
  );
};

export default HeaderPlateforme;
