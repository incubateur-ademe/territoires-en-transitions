'use client';

import { Button } from '@tet/ui';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import Section from '@tet/site/components/sections/Section';
import Markdown from '@tet/site/components/markdown/Markdown';

type AccompagnementProps = {
  titre: string;
  description?: string;
  contenu: {
    titre: string;
    description: string;
    image: StrapiItem;
    button: { titre: string; href: string };
  }[];
};

const Accompagnement = ({
  titre,
  description,
  contenu,
}: AccompagnementProps) => {
  return (
    <Section
      containerClassName="max-md:!py-6 md:!pt-14"
      className="!max-w-[1200px]"
    >
      <h1 className="text-center text-primary-10 text-3xl mb-0">{titre}</h1>
      <p className="text-center text-primary-10 text-xl">{description}</p>
      <div className="flex flex-col max-md:gap-4 gap-10">
        {contenu.map((c, index) => (
          <div
            key={index}
            className="p-4 md:p-8 rounded-lg border-2 !border-primary-2 !bg-primary-0 flex max-md:flex-col gap-6 xl:gap-8"
          >
            {!!c.image && (
              <StrapiImage
                data={c.image}
                className="max-h-[200px] w-full"
                containerClassName="w-28 min-w-[112px]"
                displayCaption={false}
              />
            )}

            <div className="h-full flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {!!c.titre && (
                  <h4 className="text-primary-10 text-xl mb-0">{c.titre}</h4>
                )}

                <Markdown
                  texte={c.description}
                  className="paragraphe-16 colored_bold markdown_style leading-5"
                />
              </div>

              <Button href={c.button.href} size="xs">
                {c.button.titre}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Accompagnement;
