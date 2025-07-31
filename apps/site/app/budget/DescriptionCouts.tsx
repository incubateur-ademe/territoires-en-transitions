import { Vignette } from '@/site/app/types';
import Markdown from '@/site/components/markdown/Markdown';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';

export type DescriptionCoutsProps = {
  titre: string;
  liste: Vignette[];
};

const DescriptionCouts = ({ titre, liste }: DescriptionCoutsProps) => {
  return (
    <>
      <h5 className="text-primary-8 mb-10">{titre}</h5>
      <div className="flex flex-col gap-10">
        {liste.map((description) => (
          <div key={description.id} className="flex items-start gap-5">
            {description.image && (
              <DEPRECATED_StrapiImage
                data={description.image}
                containerClassName="bg-primary-1 rounded-2xl max-md:p-4 p-6 max-md:w-[77px] w-[115px] max-md:h-[77px] h-[115px] flex-none"
                className="w-full f-full"
              />
            )}
            <div>
              {!!description.titre && (
                <h4 className="text-primary-9 mb-1">{description.titre}</h4>
              )}
              {!!description.legende && (
                <Markdown
                  texte={description.legende}
                  className="paragraphe-16 paragraphe-primary-11 -mb-6"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DescriptionCouts;
