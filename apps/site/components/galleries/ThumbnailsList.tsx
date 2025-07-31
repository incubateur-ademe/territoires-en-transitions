import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

type ThumbnailsListProps = {
  thumbnails: {
    id: number;
    legend: string;
    image?: StrapiItem;
  }[];
};

const ThumbnailsList = ({ thumbnails }: ThumbnailsListProps) => {
  return (
    <div className="flex max-md:flex-col flex-wrap justify-center gap-14 max-md:px-12">
      {thumbnails.map((thumbnail) => (
        <div
          key={thumbnail.id}
          className="flex flex-col items-center gap-8 w-fit max-md:mx-auto"
        >
          {!!thumbnail.image && (
            <DEPRECATED_StrapiImage
              data={thumbnail.image}
              containerClassName="bg-white rounded-full w-[196px]"
              className="w-[196px] h-[196px] min-w-[196px] min-h-[196px] p-10 object-cover rounded-full"
            />
          )}
          <h6 className="text-primary-9 text-center text-base md:text-lg leading-5 mb-0 max-md:max-w-[300px] md:w-[250px]">
            {thumbnail.legend}
          </h6>
        </div>
      ))}
    </div>
  );
};

export default ThumbnailsList;
