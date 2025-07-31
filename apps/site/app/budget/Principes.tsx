import { Vignette } from '@/site/app/types';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';

type PrincipesProps = {
  titre: string;
  description: string;
  liste: Vignette[];
};

const Principes = ({ titre, description, liste }: PrincipesProps) => {
  return (
    <div className="bg-white md:rounded-xl py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9">{titre}</h2>

      <p className="paragraphe-16 text-primary-11">{description}</p>

      {liste.map((principe) => (
        <div key={principe.id} className="flex items-center gap-5 mb-10">
          {principe.image && (
            <DEPRECATED_StrapiImage
              data={principe.image}
              containerClassName="bg-primary-1 rounded-2xl p-4 w-[77px] h-[77px] flex-none"
              className="w-full f-full"
            />
          )}
          {principe.titre && (
            <div className="text-primary-11 text-base leading-6 font-bold">
              {principe.titre}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Principes;
