import Markdown from '@tet/site/components/markdown/Markdown';
import { Liste } from './types';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import ReactIcon from '@tet/site/components/react-icons/ReactIcon';

const ListeGrilleService = ({ liste }: { liste: Liste }) => {
  return (
    liste.length > 0 && (
      <div className="grid max-md:grid-cols-1 grid-cols-2 gap-8 mt-6">
        {liste.map((l) => (
          <div key={l.id} className="rounded-2xl p-12 bg-white">
            <div>
              <div className="flex items-center gap-2">
                {!!l.icone && (
                  <ReactIcon
                    icon={l.icone}
                    className="text-2xl text-primary-10"
                  />
                )}
                {!!l.preTitre && (
                  <div className="text-primary-10 font-bold text-base">
                    {l.preTitre}
                  </div>
                )}
              </div>
              {!!l.titre && (
                <div className="text-orange-1 uppercase text-5xl font-extrabold mb-4">
                  {l.titre}
                </div>
              )}
              <Markdown
                texte={l.texte}
                className="paragraphe-16 paragraphe-primary-9 -mb-6"
              />
              {!!l.image && (
                <StrapiImage
                  data={l.image}
                  className="max-h-[300px] max-w-full mx-auto"
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
