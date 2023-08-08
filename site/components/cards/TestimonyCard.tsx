import QuoteIcon from 'public/icones/QuoteIcon';

type TestimonyCardProps = {
  content: string;
  author: string;
  role?: string;
  imageSrc?: string;
};

/**
 * Carte pour l'affichage d'un témoignage
 */

const TestimonyCard = ({
  content,
  author,
  role,
  imageSrc,
}: TestimonyCardProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center">
      <picture>
        <img
          src={imageSrc ? imageSrc : 'placeholder.png'}
          alt={`${author} - ${role}`}
          className="w-[185px] h-[185px] object-cover rounded-full"
        />
      </picture>

      <div className="lg:border-l px-8 lg:pr-0 lg:pl-8 max-w-[600px]">
        <QuoteIcon className="mb-6" />
        <p className="text-xl font-bold leading-8">« {content} »</p>
        <div>
          <p className="mb-1 font-bold">{author}</p>
          {role && <p className="mb-0 text-xs text-[#666666] italic">{role}</p>}
        </div>
      </div>
    </div>
  );
};

export default TestimonyCard;
