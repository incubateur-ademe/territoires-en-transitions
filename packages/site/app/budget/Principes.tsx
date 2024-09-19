import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';

type PrincipesProps = {
  titre: string;
  description: string;
  liste: {
    id: number;
    legende: string;
    image: StrapiItem;
  }[];
};

const Principes = ({ titre, description, liste }: PrincipesProps) => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9">{titre}</h2>

      <p className="paragraphe-16 text-primary-11">{description}</p>

      {liste.map((principe) => (
        <div key={principe.id} className="flex items-center gap-5 mb-10">
          <StrapiImage
            data={principe.image}
            containerClassName="bg-primary-1 rounded-[15px] p-4 w-[77px] h-[77px] flex-none"
            className="w-full f-full"
          />
          <div className="text-primary-11 text-[16px] leading-[25px] font-bold">
            {principe.legende}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Principes;
