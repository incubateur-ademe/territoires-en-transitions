import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

type PresentationTrajectoireProps = {
  bloc1: {
    titre: string;
    texte: string;
    image: StrapiItem;
  };
  bloc2: {
    titre: string;
    texte: string;
    image: StrapiItem;
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
          <DEPRECATED_StrapiImage
            data={bloc1.image}
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
          <DEPRECATED_StrapiImage
            data={bloc2.image}
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
