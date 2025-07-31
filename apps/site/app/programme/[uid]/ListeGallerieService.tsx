import ButtonsList from '@/site/components/buttons/ButtonsList';
import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import Markdown from '@/site/components/markdown/Markdown';
import ReactIcon from '@/site/components/react-icons/ReactIcon';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Liste } from './types';

const ListeGallerieService = ({ liste }: { liste: Liste }) => {
  return (
    liste.length > 0 && (
      <MasonryGallery
        maxCols={2}
        data={liste.map((l) => (
          <div key={l.id} className="rounded-2xl p-8 border border-primary-4">
            <div className="flex items-center gap-2 mb-3">
              {!!l.icone && (
                <ReactIcon icon={l.icone} className="text-4xl text-primary-6" />
              )}
              {!!l.preTitre && (
                <div className="text-xl text-white font-bold bg-primary-6 rounded-full p-1 w-fit min-w-[36px]">
                  <div className="mx-auto w-fit">{l.preTitre}</div>
                </div>
              )}
            </div>

            {!!l.titre && <h4 className="text-primary-8">{l.titre}</h4>}

            <Markdown texte={l.texte} className="paragraphe-16" />

            <ButtonsList
              boutons={l.boutons}
              buttonsSize="sm"
              className="mt-6"
            />

            {!!l.image && (
              <DEPRECATED_StrapiImage
                data={l.image}
                className="max-h-[300px] max-w-full mx-auto mt-8"
              />
            )}
          </div>
        ))}
      />
    )
  );
};

export default ListeGallerieService;
