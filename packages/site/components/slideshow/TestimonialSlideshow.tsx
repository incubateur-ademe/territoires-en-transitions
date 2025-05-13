import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { ButtonVariant } from '@/ui';
import classNames from 'classnames';
import Slideshow from './Slideshow';

type TestimonialSlideshowProps = {
  contenu: {
    id: number;
    auteur: string;
    role: string;
    temoignage: string;
    portrait?: StrapiItem;
  }[];
  autoSlide?: boolean;
  autoSlideDelay?: number;
  title?: string;
  displayTitle?: boolean;
  titleColor?: string;
  backgroundColor?: string;
  dotsColor?: 'default' | 'orange';
  displayButtons?: boolean;
  buttonsVariant?: ButtonVariant;
  className?: string;
};

const TestimonialSlideshow = ({
  contenu,
  title = 'Ils ont dit...',
  displayTitle = true,
  titleColor = 'orange-1',
  backgroundColor = 'bg-grey-1',
  className,
  ...otherProps
}: TestimonialSlideshowProps) => {
  return (
    <Slideshow
      className={classNames('p-8', backgroundColor, className)}
      slides={contenu.map((t) => (
        <div
          key={t.id}
          className={classNames(
            'flex max-lg:flex-col justify-start items-start',
            backgroundColor,
            { 'gap-8': t.portrait }
          )}
        >
          {t.portrait ? (
            <DEPRECATED_StrapiImage
              data={t.portrait}
              className="w-[137px] h-[137px] min-w-[137px] min-h-[137px] object-cover rounded-full border-[5px] border-primary-3"
              displayCaption={false}
            />
          ) : (
            <div className="w-0 h-[137px] max-lg:hidden" />
          )}
          <div>
            {displayTitle && (
              <h3 className={`text-${titleColor} mb-2`}>{title}</h3>
            )}
            <p className="paragraphe-18 mb-0">« {t.temoignage} »</p>
            <p className="text-primary-10 text-[18px] font-bold mt-6 mb-0">
              {t.auteur}
            </p>
            <p className="text-grey-8 text-[18px] italic mt-2 mb-0">{t.role}</p>
          </div>
        </div>
      ))}
      {...otherProps}
    />
  );
};

export default TestimonialSlideshow;
