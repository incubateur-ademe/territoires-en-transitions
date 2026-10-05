import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { StrapiMedia } from '@/site/src/strapi/types';

type ProgrammeHeroSectionProps = {
  couverture: StrapiMedia;
  couvertureMobile?: StrapiMedia | null;
};

/**
 * Couverture desktop et, si elle existe, mobile : la bascule se fait en CSS
 * (breakpoint md). En chargement différé, une image masquée n'est jamais
 * téléchargée ; seule la couverture unique est chargée en priorité.
 */
const ProgrammeHeroSection = ({
  couverture,
  couvertureMobile,
}: ProgrammeHeroSectionProps) => {
  const desktop = (
    <StrapiImage
      media={couverture}
      sizes="(min-width: 1460px) 1460px, 100vw"
      containerClassName={
        couvertureMobile
          ? 'xl:max-w-[1460px] mx-auto max-md:hidden'
          : 'xl:max-w-[1460px] mx-auto'
      }
      className="w-full h-auto"
      priority={!couvertureMobile}
      withIntrinsicSize
    />
  );

  if (!couvertureMobile) return desktop;

  return (
    <>
      <StrapiImage
        media={couvertureMobile}
        sizes="100vw"
        containerClassName="w-full md:hidden"
        className="w-full h-auto"
        withIntrinsicSize
      />
      {desktop}
    </>
  );
};

export default ProgrammeHeroSection;
