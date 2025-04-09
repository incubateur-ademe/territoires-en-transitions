import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import Markdown from '@/site/components/markdown/Markdown';
import { StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Liste } from './types';

const ListeGallerieService = ({ liste }: { liste: Liste }) => {
  return (
    liste.length > 0 && (
      <MasonryGallery
        maxCols={2}
        data={liste.map((l) => (
          <div key={l.id}>
            <div key={l.id} className="rounded-2xl p-8 border border-primary-4">
              {!!l.preTitre && (
                <div className="mb-3 text-xl text-white font-bold bg-primary-6 rounded-full p-1 w-fit min-w-[36px]">
                  <div className="mx-auto w-fit">{l.preTitre}</div>
                </div>
              )}

              {!!l.titre && <h4 className="text-primary-8">{l.titre}</h4>}
              <Markdown texte={l.texte} className="paragraphe-16 -mb-6" />
              {!!l.image && (
                <StrapiImage
                  data={l.image}
                  className="max-h-[300px] max-w-full mx-auto"
                />
              )}
            </div>
          </div>
        ))}
      />
    )
  );
};

export default ListeGallerieService;
