'use client';

import Markdown from '@/site/components/markdown/Markdown';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';

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
  action: { titre, contenu: contenuInitial, image },
}: ActionCollectiviteProps) => {
  const [contenuOpen, setContenuOpen] = useState(false);
  const limitContent = 700;

  // enlève les sauts de ligne en trop et les lignes vides
  const contenu = contenuInitial
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');

  // crée une version tronquée du contenu (affichée avec le bouton "Lire plus")
  const pourraitEtreTronque = contenu.length > limitContent;
  const contenuTronque = pourraitEtreTronque
    ? splitContent(contenu, limitContent)
    : contenu;

  // détermine si le contenu est effectivement tronqué
  // (les boutons Lire moins/Lire plus doivent être affichés)
  const estTronque = contenu !== contenuTronque;

  return (
    <div className="rounded-[10px] bg-white overflow-hidden">
      {image && (
        <DEPRECATED_StrapiImage
          data={image}
          className="object-cover object-center h-full w-full"
          containerClassName="h-[450px] w-full overflow-hidden"
          displayCaption
        />
      )}

      <div
        className={classNames('py-10 px-8 lg:p-8', {
          '-mb-6': !estTronque,
        })}
      >
        <h3>{titre}</h3>
        <Markdown
          texte={estTronque && !contenuOpen ? `${contenuTronque}...` : contenu}
          className="paragraphe-16 mb-6"
        />

        {estTronque && (
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
