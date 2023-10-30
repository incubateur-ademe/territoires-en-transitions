import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {ParagrapheCustomArticleData} from 'app/types';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ParagrapheArticleProps = {
  paragraphe: ParagrapheCustomArticleData;
};

const ParagrapheArticle = ({
  paragraphe: {titre, texte, image, alignementImage, legendeVisible},
}: ParagrapheArticleProps) => {
  return (
    <div className="flex flex-col w-full">
      {/* Titre du paragraphe */}
      {titre && <h2 className="text-center w-full mt-8 mb-6">{titre}</h2>}

      {/* Image si alignement au centre haut */}
      {image && alignementImage === 'Centre Haut' && (
        <StrapiImage
          data={image}
          containerClassName="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto"
          displayCaption={legendeVisible}
        />
      )}

      {/* Contenu du paragraphe */}
      {(texte ||
        (image &&
          (alignementImage === 'Gauche' || alignementImage === 'Droite'))) && (
        <div className="flex flex-col md:block">
          {/* Image si alignement à gauche ou à droite */}
          {image &&
            (alignementImage === 'Gauche' || alignementImage === 'Droite') && (
              <StrapiImage
                data={image}
                className="max-h-full"
                containerClassName={classNames(
                  'w-full md:w-auto md:max-w-[35%] md:!min-w-[200px] h-full md:h-auto flex flex-col md:block justify-center items-center mb-6 md:mb-0',
                  {
                    'float-left md:mr-6': alignementImage === 'Gauche',
                    'float-right md:ml-6': alignementImage === 'Droite',
                  },
                )}
                displayCaption={legendeVisible}
              />
            )}

          {/* Texte */}
          {texte && (
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="text-lg break-words sm:break-normal"
            >
              {texte}
            </Markdown>
          )}
        </div>
      )}

      {/* Image si alignement au centre bas */}
      {image && alignementImage === 'Centre Bas' && (
        <StrapiImage
          data={image}
          containerClassName="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto"
          displayCaption={legendeVisible}
        />
      )}
    </div>
  );
};

export default ParagrapheArticle;
