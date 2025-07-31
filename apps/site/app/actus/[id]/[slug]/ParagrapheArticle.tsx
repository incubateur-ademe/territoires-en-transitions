import { ParagrapheCustomArticleData } from '@/site/app/types';
import Markdown from '@/site/components/markdown/Markdown';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import classNames from 'classnames';

type ParagrapheArticleProps = {
  paragraphe: ParagrapheCustomArticleData;
};

const ParagrapheArticle = ({
  paragraphe: { titre, texte, image, alignementImage, legendeVisible },
}: ParagrapheArticleProps) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Titre du paragraphe */}
      {!!titre && <h2 className="text-center w-full mb-0 mt-2">{titre}</h2>}

      {/* Image si alignement au centre haut */}
      {image && alignementImage === 'Centre Haut' && (
        <DEPRECATED_StrapiImage
          data={image}
          containerClassName="max-w-full lg:max-w-[80%] flex flex-col justify-center items-center mx-auto"
          className="h-auto max-h-[500px]"
          displayCaption={legendeVisible}
        />
      )}

      {/* Contenu du paragraphe */}
      {(!!texte ||
        (image &&
          (alignementImage === 'Gauche' || alignementImage === 'Droite'))) && (
        <div className="flex flex-col gap-12 sm:block">
          {/* Image si alignement à gauche ou à droite */}
          {image &&
            (alignementImage === 'Gauche' || alignementImage === 'Droite') && (
              <DEPRECATED_StrapiImage
                data={image}
                className="max-h-full"
                containerClassName={classNames(
                  'w-full sm:w-auto sm:max-w-[50%] md:max-w-[35%] sm:!min-w-[200px] h-full sm:h-auto flex flex-col sm:block justify-center items-center sm:mb-6',
                  {
                    'float-left sm:mr-6': alignementImage === 'Gauche',
                    'float-right sm:ml-6': alignementImage === 'Droite',
                  }
                )}
                displayCaption={legendeVisible}
              />
            )}

          {/* Texte */}
          {!!texte && (
            <Markdown
              texte={texte}
              className="text-lg break-words sm:break-normal [&_h1]:mt-12 [&_h2]:mt-12 [&_h3]:mt-12 [&_h4]:mt-12 [&_h5]:mt-12 [&_h6]:mt-12 [&>*:first-child]:mt-0"
            />
          )}
        </div>
      )}

      {/* Image si alignement au centre bas */}
      {image && alignementImage === 'Centre Bas' && (
        <DEPRECATED_StrapiImage
          data={image}
          containerClassName="max-w-full lg:max-w-[80%] flex flex-col justify-center items-center mx-auto"
          className="h-auto max-h-[500px]"
          displayCaption={legendeVisible}
        />
      )}
    </div>
  );
};

export default ParagrapheArticle;
