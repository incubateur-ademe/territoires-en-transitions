import QuoteIcon from '@/site/components/icones/QuoteIcon';
import { StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import Image from 'next/image';

type TestimonialCardProps = {
  content: string;
  author: string;
  role?: string;
  image?: StrapiItem;
};

/**
 * Carte pour l'affichage d'un témoignage
 */

const TestimonialCard = ({
  content,
  author,
  role,
  image,
}: TestimonialCardProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center">
      {image ? (
        <StrapiImage
          data={image}
          className="w-[185px] h-[185px] object-cover rounded-full"
          displayCaption={false}
        />
      ) : (
        <Image
          className="w-[185px] h-[185px] object-cover rounded-full block"
          src="/placeholder.svg"
          alt="pas d'image disponible"
          width={354}
          height={201}
        />
      )}

      <div className="lg:border-l px-8 lg:pr-0 lg:pl-8 max-w-[600px]">
        <QuoteIcon className="mb-6" />
        <p className="text-xl font-bold leading-8">« {content} »</p>
        <div>
          <p className="mb-1 font-bold">{author}</p>
          {!!role && (
            <p className="mb-0 text-xs text-[#666666] italic">{role}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
