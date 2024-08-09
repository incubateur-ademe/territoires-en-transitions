import Markdown from '@tet/site/components/markdown/Markdown';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';

export type DescriptionCoutsProps = {
  titre: string;
  liste: {
    id: number;
    titre?: string;
    legende: string;
    image: StrapiItem;
  }[];
};

const DescriptionCouts = ({ titre, liste }: DescriptionCoutsProps) => {
  return (
    <>
      <h5>{titre}</h5>
      <div className="flex flex-col gap-10">
        {liste.map((description) => (
          <div key={description.id} className="flex items-start gap-5">
            <StrapiImage
              data={description.image}
              containerClassName="bg-primary-1 rounded-[15px] max-md:p-4 p-6 max-md:w-[77px] w-[115px] max-md:h-[77px] h-[115px] flex-none"
              className="w-full f-full"
            />
            <div>
              {!!description.titre && (
                <h4 className="text-primary-9 mb-1">{description.titre}</h4>
              )}
              <Markdown
                texte={description.legende}
                className="paragraphe-16 paragraphe-primary-11 -mb-6"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DescriptionCouts;
