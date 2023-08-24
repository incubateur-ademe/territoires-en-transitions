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
  paragraphe: {titre, texte, image, alignementImage},
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
    <div className="flex flex-col gap-6">
      {/* Titre du paragraphe */}
      {titre && <h4 className="text-center w-full mt-8">{titre}</h4>}

      {/* Contenu du paragraphe */}
      <div className="flex flex-col gap-6 md:block">
        {/* Image si alignement à gauche ou à droite */}
        {image && alignementImage !== 'Centre' && (
          <picture
            className={classNames(
              'w-full md:w-auto md:max-w-[35%] h-full md:h-auto flex md:block justify-center items-center mb-6 md:mb-0',
              {
                'float-left md:mr-6': alignementImage === 'Gauche',
                'float-right md:ml-6': alignementImage === 'Droite',
              },
            )}
          >
            <StrapiImage data={image} className="max-h-full" />
          </picture>
        )}

        {/* Texte */}
        {processedText && (
          <p
            className="text-lg"
            dangerouslySetInnerHTML={{
              __html: processedText,
            }}
          />
        )}
      </div>

      {/* Image si alignement au centre */}
      {image && alignementImage === 'Centre' && (
        <picture className="w-full h-full flex justify-center items-center mb-6">
          <StrapiImage data={image} />
        </picture>
      )}
    </div>
  );
};

export default ParagrapheArticle;
