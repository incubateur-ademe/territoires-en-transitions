'use client';

import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {ParagrapheArticleData} from 'app/types';
import {useEffect, useState} from 'react';
import {processMarkedContent} from 'src/utils/processMarkedContent';
import classNames from 'classnames';

type PerformanceProps = {
  data: ParagrapheArticleData;
};

const Performance = ({
  data: {titre, texte, image, legendeVisible},
}: PerformanceProps) => {
  const [processedText, setProcessedText] = useState<string>('');

  const processContent = async (texte: string) => {
    const newText = await processMarkedContent(texte);
    setProcessedText(newText);
  };

  useEffect(() => {
    if (texte) processContent(texte);
  }, [texte]);

  return (
    <>
      {titre && <h2 className="text-center">{titre}</h2>}

      <div className="lg:relative mb-6">
        {processedText && (
          <div
            className={classNames('w-full rounded-xl bg-[#f5f5fe] p-6', {
              'lg:w-2/3 mb-6':
                !!image && image.attributes.width >= image.attributes.height,
              'lg:w-4/5 mb-6':
                !!image && image.attributes.width < image.attributes.height,
            })}
          >
            <div
              className={classNames('w-full -mb-6', {
                'lg:w-2/3':
                  !!image && image.attributes.width >= image.attributes.height,
                'lg:w-5/6':
                  !!image && image.attributes.width < image.attributes.height,
              })}
              dangerouslySetInnerHTML={{
                __html: processedText,
              }}
            />
          </div>
        )}
        {image && (
          <StrapiImage
            data={image}
            className="w-full lg:w-auto lg:max-h-[400px] mx-auto"
            containerClassName={classNames(
              'lg:absolute lg:top-14 lg:right-0 w-full',
              {
                'lg:max-w-[55%]':
                  image.attributes.width >= image.attributes.height,
                'lg:max-w-[35%]':
                  image.attributes.width < image.attributes.height,
              },
            )}
            displayCaption={legendeVisible}
          />
        )}
      </div>
    </>
  );
};

export default Performance;
