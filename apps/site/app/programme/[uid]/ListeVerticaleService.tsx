import ButtonsList from '@/site/components/buttons/ButtonsList';
import Markdown from '@/site/components/markdown/Markdown';
import ReactIcon from '@/site/components/react-icons/ReactIcon';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { Liste } from './types';

const ListeVerticaleService = ({ liste }: { liste: Liste }) => {
  return (
    <>
      {liste.map((l) => (
        <div
          key={l.id}
          className="flex max-md:flex-col gap-6 bg-primary-1 rounded-2xl p-8"
        >
          {!!l.image && (
            <DEPRECATED_StrapiImage
              data={l.image}
              containerClassName="flex-none w-[115px] h-[115px] max-md:mx-auto"
              className="rounded-2xl h-full w-full object-cover"
            />
          )}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {!!l.icone && (
                <ReactIcon icon={l.icone} className="text-3xl text-primary-9" />
              )}
              {!!l.titre && <h4 className="mb-0">{l.titre}</h4>}
            </div>

            <Markdown texte={l.texte} className="paragraphe-16" />

            <ButtonsList
              boutons={l.boutons}
              buttonsSize="sm"
              className="mt-2"
            />
          </div>
        </div>
      ))}
    </>
  );
};

export default ListeVerticaleService;
