import Image from 'next/image';

import { signInPath, signUpPath } from '@/app/app/paths';
import homeImage from '@/app/app/static/img/home.jpg';
import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';

export const HomePage = () => {
  return (
    <section
      data-test="home"
      className="pt-20 bg-gradient-to-b from-primary-1 to-white"
    >
      <div className="flex flex-col items-center max-w-6xl mx-auto px-6 text-center">
        <h1 className="text-primary-9 mb-6">{appLabels.homeTitre}</h1>
        <p className="my-4 text-lg text-primary-10">
          {appLabels.homeIntroduction}
          <br />
          <br />
          {appLabels.homeCreerCompte}
          <br />
          <br />
          {appLabels.homeQuestionsChat}
        </p>
        <Button
          href="https://www.territoiresentransitions.fr/outil-numerique"
          external
          variant="white"
          size="xs"
          className="my-6"
        >
          {appLabels.homeEnSavoirPlus}
        </Button>
        <div className="flex gap-3 mb-12">
          <Button href={signUpPath} prefetch={false} variant="outlined">
            {appLabels.homeCtaCreerCompte}
          </Button>
          <Button href={signInPath} prefetch={false}>
            {appLabels.homeCtaSeConnecter}
          </Button>
        </div>
        <Image
          className="rounded-t-3xl border-t border-l border-r border-primary-4"
          src={homeImage}
          alt={appLabels.homeImageAlt}
          loading="eager"
          // Largeur d'affichage max = conteneur `max-w-6xl` (1152px) moins le
          // padding `px-6` (2×24px) = 1104px. Sans ce `sizes`, next/image
          // réclame la plus grande source (w=3840) et fait ramer l'optimisation.
          sizes="(max-width: 1152px) 100vw, 1104px"
        />
      </div>
    </section>
  );
};
