import MasonryGallery from '@components/galleries/MasonryGallery';
import {Liste} from './types';
import Markdown from '@components/markdown/Markdown';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

const ListeGallerieService = ({liste}: {liste: Liste}) => {
  return (
    liste.length > 0 && (
      <MasonryGallery
        maxCols={2}
        data={liste.map(l => (
          <div key={l.id}>
            <div key={l.id} className="rounded-2xl p-8 border border-primary-4">
              <div>
                {!!l.preTitre && (
                  <div className="text-xl text-white font-bold bg-primary-6 rounded-full p-1 w-fit min-w-[36px] mb-3">
                    <div className="mx-auto w-fit">{l.preTitre}</div>
                  </div>
                )}
                <h4 className="text-primary-8">{l.titre}</h4>
                <Markdown texte={l.texte} className="paragraphe-16" />
                {!!l.image && (
                  <StrapiImage
                    data={l.image}
                    className="max-h-[300px] max-w-full mx-auto"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      />
    )
  );
};

export default ListeGallerieService;
