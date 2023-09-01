'use client';

import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {processMarkedContent} from 'src/utils/processMarkedContent';
import {ParagrapheArticleData} from './types';

type ParagrapheArticleProps = {
  paragraphe: ParagrapheArticleData;
};

const ParagrapheArticle = ({
  paragraphe: {titre, texte, image, alignementImage, legendeImage},
}: ParagrapheArticleProps) => {
  const [processedText, setProcessedText] = useState<string | undefined>();

  const processContent = async (texte: string) => {
    const newText = await processMarkedContent(texte);
    setProcessedText(newText);
  };

  useEffect(() => {
    if (texte) processContent(texte);
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Titre du paragraphe */}
      {titre && <h4 className="text-center w-full mt-8 mb-6">{titre}</h4>}

      {/* Image si alignement au centre haut */}
      {image && alignementImage === 'Centre Haut' && (
        <picture className="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto">
          <StrapiImage data={image} />
          {legendeImage && (
            <span className="!text-sm text-[#666] mt-2 w-full text-center">
              {legendeImage}
            </span>
          )}
        </picture>
      )}

      {/* Contenu du paragraphe */}
      {(processedText ||
        (image &&
          (alignementImage === 'Gauche' || alignementImage === 'Droite'))) && (
        <div className="flex flex-col md:block">
          {/* Image si alignement à gauche ou à droite */}
          {image &&
            (alignementImage === 'Gauche' || alignementImage === 'Droite') && (
              <picture
                className={classNames(
                  'w-full md:w-auto md:max-w-[35%] md:!min-w-[200px] h-full md:h-auto flex flex-col md:block justify-center items-center mb-6 md:mb-0',
                  {
                    'float-left md:mr-6': alignementImage === 'Gauche',
                    'float-right md:ml-6': alignementImage === 'Droite',
                  },
                )}
              >
                <StrapiImage data={image} className="max-h-full" />
                {legendeImage && (
                  <span className="!text-sm text-[#666] mt-2 text-center">
                    {legendeImage}
                  </span>
                )}
              </picture>
            )}

          {/* Texte */}
          {processedText && (
            <div
              className="text-lg break-words sm:break-normal"
              dangerouslySetInnerHTML={{
                __html: processedText,
              }}
            />
          )}
        </div>
      )}

      {/* Image si alignement au centre bas */}
      {image && alignementImage === 'Centre Bas' && (
        <picture className="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto">
          <StrapiImage data={image} />
          {legendeImage && (
            <span className="!text-sm text-[#666] mt-2 w-full text-center">
              {legendeImage}
            </span>
          )}
        </picture>
      )}
    </div>
  );
};

export default ParagrapheArticle;
