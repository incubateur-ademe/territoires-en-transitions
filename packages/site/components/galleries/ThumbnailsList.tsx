import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';

type ThumbnailsListProps = {
  thumbnails: {
    id: number;
    legend: string;
    image: StrapiItem;
  }[];
};

const ThumbnailsList = ({thumbnails}: ThumbnailsListProps) => {
  return (
    <div className="flex max-md:flex-col max-lg:flex-wrap justify-center gap-14 lg:gap-32 max-md:px-12">
      {thumbnails.map(thumbnail => (
        <div
          key={thumbnail.id}
          className="flex flex-col items-center gap-8 md:gap-10 w-96 mx-auto"
        >
          <StrapiImage
            data={thumbnail.image}
            containerClassName="bg-white p-10 rounded-full w-[196px]"
          />
          <h6 className="text-primary-9 text-center text-[16px] md:text-[18px] leading-[22px] mb-0 max-md:max-w-[300px]">
            {thumbnail.legend}
          </h6>
        </div>
      ))}
    </div>
  );
};

export default ThumbnailsList;
