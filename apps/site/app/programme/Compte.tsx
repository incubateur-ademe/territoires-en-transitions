'use client';

import posthog from 'posthog-js';

import Arrow from '@/site/app/outil-numerique/Arrow';
import { useEvolutionTotalActivation } from '@/site/app/stats/EvolutionTotalActivationParType';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { Button } from '@/ui';

type CompteProps = {
  titre: string;
  description: string;
  cta: string;
  image: StrapiItem | undefined;
};

const Compte = ({ titre, description, cta, image }: CompteProps) => {
  const { data } = useEvolutionTotalActivation('', '');
  const collectivitesActivees = data ? data.courant.total : undefined;

  return (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <div className="flex max-lg:flex-col justify-between items-center max-md:gap-8 gap-12">
        {!!image && (
          <DEPRECATED_StrapiImage
            data={image}
            containerClassName="w-fit shrink rounded-lg border border-primary-3"
            containerStyle={{ boxShadow: '0px 4px 20px 0px #0000000D' }}
            className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
          />
        )}
        <div>
          <h2 className="text-primary-8">{titre}</h2>
          <Markdown
            texte={description}
            className="markdown_style font-bold text-primary-9 leading-5"
          />
          <Button
            href="https://auth.territoiresentransitions.fr/signup"
            onClick={() => posthog.capture('inscription_plateforme')}
            className="mt-8 max-lg:mx-auto"
            external
          >
            {cta}
          </Button>
        </div>
      </div>

      {!!collectivitesActivees && (
        <div className="max-lg:hidden flex justify-center gap-4 h-[32px] mt-2 ml-28 self-start">
          <Arrow />
          <p className="text-primary-9 text-[13px] font-bold mb-0 pt-2">
            Déjà {collectivitesActivees} collectivités utilisatrices
          </p>
        </div>
      )}
    </Section>
  );
};

export default Compte;
