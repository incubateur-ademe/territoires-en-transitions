import Markdown from '@/site/components/markdown/Markdown';
import { StrapiImage } from '@/site/components/strapiImage/StrapiImage';
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
            <StrapiImage
              data={l.image}
              containerClassName="flex-none w-[115px] h-[115px] max-md:mx-auto"
              className="rounded-2xl h-full w-full object-cover"
            />
          )}
          <div className="flex flex-col gap-4">
            {!!l.titre && <h4 className="mb-0">{l.titre}</h4>}

            <Markdown texte={l.texte} className="paragraphe-16 -mb-6" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ListeVerticaleService;
