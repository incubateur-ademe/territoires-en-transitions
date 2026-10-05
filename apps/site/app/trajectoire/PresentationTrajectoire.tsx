import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { StrapiMedia } from '@/site/src/strapi/types';

type PresentationTrajectoireProps = {
  bloc1: {
    titre: string;
    texte: string;
    image: StrapiMedia | null;
  };
  bloc2: {
    titre: string;
    texte: string;
    image: StrapiMedia | null;
  };
};

const PresentationTrajectoire = ({
  bloc1,
  bloc2,
}: PresentationTrajectoireProps) => {
  return (
    <>
      {/* Bloc 1 */}
      <Section
        className="flex lg:!flex-row justify-between items-center !gap-12"
        containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      >
        <div>
          <h2 className="text-primary-10 max-lg:text-center">{bloc1.titre}</h2>
          <Markdown
            texte={bloc1.texte}
            className="paragraphe-primary-10 paragraphe-18 markdown_style"
          />
        </div>
        {!!bloc1.image && (
          <StrapiImage
            media={bloc1.image}
            sizes="(min-width: 1440px) 576px, (min-width: 1024px) 448px, (min-width: 640px) 576px, 100vw"
            containerClassName="w-fit shrink max-lg:order-first"
            className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
          />
        )}
      </Section>

      {/* Bloc 2 */}
      <Section
        className="flex lg:!flex-row justify-between items-center !gap-12"
        containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      >
        {!!bloc2.image && (
          <StrapiImage
            media={bloc2.image}
            sizes="(min-width: 1440px) 576px, (min-width: 1024px) 448px, (min-width: 640px) 576px, 100vw"
            containerClassName="w-fit shrink"
            className="h-64 sm:h-96 w-auto max-w-full sm:max-w-xl lg:max-2xl:max-w-md object-scale-down"
          />
        )}
        <div>
          <h2 className="text-primary-10 max-lg:text-center">{bloc2.titre}</h2>
          <Markdown
            texte={bloc2.texte}
            className="paragraphe-primary-10 paragraphe-18 markdown_style"
          />
        </div>
      </Section>
    </>
  );
};

export default PresentationTrajectoire;
