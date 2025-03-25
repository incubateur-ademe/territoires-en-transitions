import { getLocalDateString } from '@/site/src/utils/getLocalDateString';
import { Badge, Button } from '@/ui';
import classNames from 'classnames';
import Image from 'next/image';
import { StrapiImage } from '../strapiImage/StrapiImage';
import { BlogCardProps } from './BlogCard';

const BlogCardContent = ({
  title,
  date,
  description,
  image,
  badge,
  href,
}: Omit<BlogCardProps, 'externalPage'>) => {
  const imgClassName =
    'w-full aspect-video object-cover object-center group-hover:scale-105 duration-700';

  return (
    <div
      className={classNames(
        'group rounded-lg bg-primary-2 hover:bg-primary-3 border border-primary-2 duration-700',
        { 'cursor-pointer': !!href }
      )}
    >
      {/* Image de la carte */}
      <div className="rounded-t-lg overflow-hidden relative">
        {image ? (
          <StrapiImage
            data={image}
            className={classNames('group-hover:brightness-90', imgClassName)}
            displayCaption={false}
          />
        ) : (
          <Image
            className={classNames(
              'bg-primary-0 group-hover:bg-primary-1',
              imgClassName
            )}
            src="/placeholder.svg"
            alt="pas d'image disponible"
            width={354}
            height={201}
          />
        )}

        {!!badge && (
          <div className="absolute top-0 left-0 p-4">
            <Badge title={badge} state="standard" size="sm" />
          </div>
        )}
      </div>

      {/* Date, titre et description */}
      <div className="p-6 flex flex-col gap-2">
        {!!date && (
          <p className="mb-0 text-grey-6 text-sm">{getLocalDateString(date)}</p>
        )}
        <h5 className="mb-0 text-xl leading-8">{title}</h5>
        {!!description && <p className="mb-0 paragraphe-16">{description}</p>}
        {!!href && (
          <Button
            icon="arrow-right-line"
            size="sm"
            variant="outlined"
            className="ml-auto mt-4"
          />
        )}
      </div>
    </div>
  );
};

export default BlogCardContent;
