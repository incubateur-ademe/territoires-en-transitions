import ButtonsList from '@/site/components/buttons/ButtonsList';
import Markdown from '@/site/components/markdown/Markdown';
import { StrapiImage } from '@/site/components/strapiImage/strapi-image';
import { Liste } from './types';

const ListeGrilleService = ({ liste }: { liste: Liste }) => {
  return (
    liste.length > 0 && (
      <div className="grid max-md:grid-cols-1 grid-cols-2 gap-8 mt-6">
        {liste.map((l) => (
          <div key={l.id} className="rounded-2xl p-12 bg-white">
            <div>
              {!!l.preTitre && (
                <div className="text-primary-10 font-bold text-base">
                  {l.preTitre}
                </div>
              )}
              {!!l.titre && (
                <div className="text-orange-1 uppercase text-5xl font-extrabold mb-4">
                  {l.titre}
                </div>
              )}
              <Markdown
                texte={l.texte}
                className="paragraphe-16 paragraphe-primary-9"
              />

              <ButtonsList
                boutons={l.boutons}
                buttonsSize="sm"
                className="mt-6"
              />

              {!!l.image && (
                <StrapiImage
                  media={l.image}
                  sizes="(min-width: 1440px) 590px, (min-width: 768px) 50vw, 100vw"
                  className="max-h-[300px] max-w-full mx-auto mt-8"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  );
};

export default ListeGrilleService;
