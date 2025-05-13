'use client';

import { VignetteAvecDetails } from '@/site/app/types';
import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Markdown from '@/site/components/markdown/Markdown';
import CardsSection from '@/site/components/sections/CardsSection';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Button, Modal } from '@/ui';
import { Fragment, useState } from 'react';

type ObjectifsProps = {
  titre: string;
  contenu: VignetteAvecDetails[] | null;
};

const Objectifs = ({ titre, contenu }: ObjectifsProps) => {
  const [openedContent, setOpenedContent] = useState<number | undefined>();

  return contenu && contenu.length ? (
    <CardsSection
      title={titre}
      textClassname="text-center"
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      cardsList={
        <CardsWrapper cols={contenu.length} className="max-md:gap-4 gap-8 mt-3">
          {contenu.map((c, index) => (
            <Fragment key={index}>
              <Card
                onClick={() => setOpenedContent(c.id)}
                className="!border-primary-3 !gap-4 xl:!gap-5 !p-4 xl:!p-5 group cursor-pointer"
                description={c.legende}
                textClassName="text-center small-text"
                image={
                  <div className="relative">
                    {c.image ? (
                      <DEPRECATED_StrapiImage
                        data={c.image}
                        displayCaption={false}
                        containerClassName="bg-[#FEF4F2] rounded-lg h-[116px] flex justify-center items-center"
                        className="max-w-[70%] max-h-[70%]"
                      />
                    ) : undefined}
                    <div className="opacity-0 group-hover:opacity-90 transition-all duration-500 absolute top-0 left-0 bg-[#FEF4F2] rounded-lg border-[0.5px] border-[#F28E40] h-[116px] w-full flex justify-center items-center text-primary-10 font-bold">
                      En savoir plus
                    </div>
                  </div>
                }
              />

              {openedContent === c.id && (
                <Modal
                  openState={{
                    isOpen: openedContent === c.id,
                    setIsOpen: (value) =>
                      value === true
                        ? setOpenedContent(c.id)
                        : setOpenedContent(undefined),
                  }}
                  size="lg"
                  title={c.titre}
                  render={() => (
                    <div className="flex flex-col gap-6">
                      {!!c.details.titre && (
                        <p className="text-grey-6 text-lg leading-8 font-bold mb-0">
                          {c.details.titre}
                        </p>
                      )}
                      <Markdown
                        texte={c.details.contenu}
                        className="text-primary-10 text-lg [&_p]:text-lg leading-8 [&_p]:leading-8"
                      />
                      {!!c.details.cta && !!c.details.cta.url && (
                        <Button
                          href={c.details.cta.url}
                          variant="underlined"
                          iconPosition="left"
                          external
                        >
                          {c.details.cta.label}
                        </Button>
                      )}
                    </div>
                  )}
                />
              )}
            </Fragment>
          ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Objectifs;
