'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';
import { Button } from '@tet/ui';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import Markdown from '@tet/site/components/markdown/Markdown';

const splitContent = (content: string, limit: number) => {
  let newContent = content.slice(0, limit);
  const sentenceEnd = content.slice(limit).split(' ')[0];
  newContent += sentenceEnd;
  return newContent;
};

type ActionCollectiviteProps = {
  action: {
    titre: string;
    contenu: string;
    image: StrapiItem;
  };
};

const ActionCollectivite = ({
  action: { titre, contenu, image },
}: ActionCollectiviteProps) => {
  const [contenuOpen, setContenuOpen] = useState(false);
  const limitContent = 700;

  return (
    <div className="rounded-[10px] bg-white overflow-hidden">
      {image && (
        <div className="h-[450px] w-full overflow-hidden relative">
          <StrapiImage
            data={image}
            className="object-cover object-center h-full w-full"
            containerClassName="object-cover object-center h-full w-full"
          />
          {(image.attributes.caption as unknown as string) && (
            <div className="text-right text-grey-1 text-[14px] leading-4 py-1 px-2 absolute right-0 top-[426px] bg-grey-8/50 rounded-tl-sm">
              {image.attributes.caption as unknown as string}
            </div>
          )}
        </div>
      )}

      <div
        className={classNames('py-10 px-8 lg:p-8', {
          '-mb-6': contenu.length <= limitContent,
        })}
      >
        <h3>{titre}</h3>
        <Markdown
          texte={
            contenu.length <= limitContent || contenuOpen
              ? contenu
              : `${splitContent(contenu, limitContent)}...`
          }
          className="paragraphe-16"
        />

        {contenu.length > limitContent && (
          <Button
            onClick={() => setContenuOpen((prevState) => !prevState)}
            variant="underlined"
          >
            {contenuOpen ? 'Lire moins' : 'Lire plus'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionCollectivite;
