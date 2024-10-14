'use client';

import Markdown from '@tet/site/components/markdown/Markdown';
import Section from '@tet/site/components/sections/Section';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import { Button, useEventTracker } from '@tet/ui';
import Arrow from '@tet/site/app/outil-numerique/Arrow';
import { useEvolutionTotalActivation } from '@tet/site/app/stats/EvolutionTotalActivationParType';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';

type CompteProps = {
  titre: string;
  description: string;
  cta: string;
  image: StrapiItem | undefined;
};

const Compte = ({ titre, description, cta, image }: CompteProps) => {
  const { data } = useEvolutionTotalActivation('', '');
  const collectivitesActivees = data ? data.courant.total : undefined;
  const tracker = useEventTracker('site/programme');

  return (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <div className="flex max-lg:flex-col justify-between items-center max-md:gap-8 gap-12">
        {!!image && (
          <StrapiImage
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
            onClick={() => tracker('inscription_plateforme', {})}
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
