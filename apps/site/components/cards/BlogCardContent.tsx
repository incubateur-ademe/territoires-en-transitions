import { getLocalDateString } from '@/site/src/utils/getLocalDateString';
import { Badge, Button } from '@tet/ui';
import classNames from 'classnames';
import Image from 'next/image';
import { DEPRECATED_StrapiImage } from '../strapiImage/StrapiImage';
import { BlogCardProps } from './BlogCard';

const BlogCardContent = ({
  title,
  date,
  description,
  image,
  badge,
  categories,
  background = 'medium',
  fullHeight,
  href,
}: Omit<BlogCardProps, 'externalPage'>) => {
  const imgClassName =
    'w-full aspect-video object-cover object-center group-hover:scale-105 duration-700';

  return (
    <div
      className={classNames(
        'group rounded-lg border border-primary-2 duration-700 flex flex-col',
        {
          'cursor-pointer': !!href,
          'bg-primary-2 hover:bg-primary-3': background === 'medium',
          'bg-primary-0 hover:bg-primary-1': background === 'light',
          'h-full': fullHeight,
        }
      )}
    >
      {/* Image de la carte */}
      <div className="rounded-t-lg overflow-hidden relative shrink-0">
        {image ? (
          <DEPRECATED_StrapiImage
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

      {/* Date, catégories, titre et description */}
      <div className="p-6 h-full flex flex-col gap-4 justify-between">
        <div className="flex flex-col gap-2">
          {!!date && (
            <p className="mb-0 text-grey-6 text-sm">
              {getLocalDateString(date)}
            </p>
          )}
          {!!categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, idx) => (
                <Badge
                  key={`${idx}-${category}`}
                  title={category}
                  state="info"
                  size="sm"
                  light
                />
              ))}
            </div>
          )}
          <h5 className="mb-0 text-xl leading-8">{title}</h5>
          {!!description && <p className="mb-0 paragraphe-16">{description}</p>}
        </div>

        {!!href && (
          <Button
            aria-label={`Lien vers la page ${title}`}
            icon="arrow-right-line"
            size="sm"
            variant="outlined"
            className="ml-auto"
          />
        )}
      </div>
    </div>
  );
};

export default BlogCardContent;
