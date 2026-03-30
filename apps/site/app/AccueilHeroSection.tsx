'use client';

import Section from '@/site/components/sections/Section';
import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button } from '@tet/ui';
import Image from 'next/image';

const AccueilHeroSection = () => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');

  return (
    <Section
      className="flex lg:!flex-row justify-between items-center gap-9"
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <div>
        <h2 className="text-primary-10 max-lg:text-center font-bold">
          La plateforme de{' '}
          <span className="text-primary-8 underline">référence</span> pour
          piloter la transition écologique de votre territoire
        </h2>
        <p className="text-primary-7 text-2xl leading-8">
          Centralisez toutes vos actions, priorisez-les et suivez vos
          indicateurs pour atteindre vos objectifs.
        </p>

        <div className="flex flex-row gap-4">
          <Button href={authPaths?.signUp}>Créer un compte</Button>
          <Button
            icon="calendar-2-line"
            variant="outlined"
            href="https://aide.territoiresentransitions.fr/fr/article/nos-sessions-demo-et-rendez-vous-individuels-ngu7tg/"
          >
            Réserver une démo
          </Button>
        </div>
      </div>
      <Image
        loading="eager"
        src="/visuel-plateforme.png"
        alt="Visuel plateforme"
        width={469}
        height={321}
      />
    </Section>
  );
};

export default AccueilHeroSection;
