import ButtonsList from '@/site/components/buttons/ButtonsList';
import Markdown from '@/site/components/markdown/Markdown';
import ReactIcon from '@/site/components/react-icons/ReactIcon';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Liste } from './types';

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
                className="paragraphe-16 paragraphe-primary-9"
              />

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
          </div>
        ))}
      </div>
    )
  );
};

export default ListeGrilleService;
