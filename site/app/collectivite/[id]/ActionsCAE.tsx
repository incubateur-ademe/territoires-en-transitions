'use client';

import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {ParagrapheArticleData} from 'app/types';
import {useEffect, useState} from 'react';
import {processMarkedContent} from 'src/utils/processMarkedContent';
import classNames from 'classnames';

type ActionsCaeProp = {
  data: ParagrapheArticleData[];
};

const ActionsCAE = ({data}: ActionsCaeProp) => {
  const [processedData, setProcessedData] = useState<ParagrapheArticleData[]>(
    [],
  );

  const processContent = async (data: ParagrapheArticleData[]) => {
    const newData = [...data];

    newData.forEach(async d => {
      const newText = d.texte ? await processMarkedContent(d.texte) : undefined;
      d.texte = newText;
    });

    setProcessedData(newData);
  };

  useEffect(() => {
    if (data.length) processContent(data);
  }, []);

  return (
    <>
      <h2 className="text-center">
        Quelques actions dans les 6 domaines
        <br /> du label climat air energie
      </h2>

      <div className="divide-y divide-[#000091]">
        {processedData.map((action, index) => (
          <div
            key={action.titre}
            className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-4"
          >
            <div
              className={classNames({
                'col-span-1': !!action.image,
                'lg:col-span-2': !!action.image,
                'col-span-3': !action.image,
              })}
            >
              {action.titre && (
                <h4
                  className={classNames('text-[#000091]', {
                    'mt-10': index !== 0,
                  })}
                >
                  {action.titre.toUpperCase()}
                </h4>
              )}
              {action.texte && (
                <div
                  className={classNames({
                    'lg:mb-10': index !== data.length - 1,
                    'mb-10': !action.image,
                  })}
                  dangerouslySetInnerHTML={{
                    __html: action.texte,
                  }}
                />
              )}
            </div>
            {action.image && (
              <StrapiImage
                data={action.image}
                className="w-full md:w-[80%] lg:w-full mx-auto"
                containerClassName="mb-10 lg:mt-10 col-span-1"
                displayCaption={action.legendeVisible}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default ActionsCAE;
