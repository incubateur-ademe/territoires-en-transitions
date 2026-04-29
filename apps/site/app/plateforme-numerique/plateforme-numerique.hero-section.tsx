import Section from '@/site/components/sections/Section';
import ImageStrapi from '@/site/components/strapiImage/ImageStrapi';
import { fetchImage } from '@/site/src/strapi/strapi';
import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button, Icon } from '@tet/ui';

export const PlateformeNumeriqueHeroSection = async () => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');
  const heroImage = await fetchImage(1529);

  return (
    <Section
      className="flex flex-col gap-8 lg:gap-16 pt-12 pb-16 border-b border-primary-3"
      containerClassName="pt-0 bg-gradient-to-b from-[#F4F5FD] to-[#FFFFFF]"
    >
      <div className="grid lg:grid-cols-[3fr_2fr] gap-4 2xl:gap-12">
        <div className="flex flex-col justify-center">
          <h1 className="max-lg:text-center">
            Pilotez votre transition écologique, simplement
          </h1>
          <p className="text-primary-7 max-lg:text-center text-2xl leading-8">
            Moins d&apos;Excel, plus d&apos;impact terrain. Territoires en
            Transitions est l&apos;outil public gratuit qui centralise vos plans
            d&apos;actions et vos indicateurs en un seul endroit.
          </p>
          <div className="flex flex-wrap gap-4 max-lg:justify-center">
            <Button
              className="after:hidden"
              variant="primary"
              href={authPaths?.signUp}
              external
            >
              Commencer maintenant (gratuit)
            </Button>
            <Button
              className="after:hidden"
              variant="outlined"
              href="https://www.youtube.com/watch?v=fFyxb7M4Wio"
              external
            >
              Voir une démo (2 min)
            </Button>
          </div>
        </div>
        <div className="max-lg:hidden w-full">
          <ImageStrapi
            strapiImage={heroImage}
            imgClassName="w-full h-auto 2xl:scale-125"
            size="50vw"
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6 2xl:gap-10">
        <Reassurance text="Déjà 1 579 collectivités utilisatrices" />
        <Reassurance text="Gratuit & sans engagement" />
        <Reassurance text="Soutenu par l'ADEME, l'ANCT, la DINUM et le SGPE" />
      </div>
    </Section>
  );
};

const Reassurance = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center gap-2">
      <Icon icon="check-line" className="text-success-3" />
      <span className="text-primary-9 text-center font-medium">{text}</span>
    </div>
  );
};
