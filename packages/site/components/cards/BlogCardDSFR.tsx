'use client';

import Markdown from '@/site/components/markdown/Markdown';
import { getLocalDateString } from '@/site/src/utils/getLocalDateString';
import { Badge } from '@/ui';
import classNames from 'classnames';
import Image from 'next/image';

type BlogCardDSFRProps = {
  title: string;
  date?: Date;
  description?: string;
  image?: React.ReactNode;
  badge?: string;
  href?: string;
  externalPage?: boolean;
  backgroundColor?: string;
};

/**
 * Carte avec un affichage de type article de blog
 * Style DSFR
 */

const BlogCardDSFR = ({
  title,
  date,
  description,
  image,
  badge,
  href,
  externalPage = false,
  backgroundColor,
}: BlogCardDSFRProps) => {
  return (
    <div
      className={classNames('fr-card fr-card--no-border border rounded-lg', {
        'fr-enlarge-link': !!href,
      })}
      style={{
        backgroundColor: backgroundColor ? backgroundColor : '#fff',
        borderColor: backgroundColor ? backgroundColor : '#ddd',
        boxShadow: backgroundColor ? '' : '0px 4px 25px 0px #0000000D',
      }}
    >
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h5 className="fr-card__title !text-primary-8 leading-[35px]">
            {href ? (
              <a
                href={href}
                className="!text-primary-8"
                target={externalPage ? '_blank' : undefined}
                rel={externalPage ? 'noreferrer noopener' : undefined}
              >
                {title}
              </a>
            ) : (
              <>{title}</>
            )}
          </h5>
          {!!description && (
            <Markdown
              texte={description.replaceAll(
                'href',
                'target="_blank" rel="noreferrer noopener" href'
              )}
              className="fr-card__desc text-primary-10 paragraphe-16"
            />
          )}
          <div className="fr-card__start">
            {date && (
              <p className="fr-card__detail">{getLocalDateString(date)}</p>
            )}
          </div>
        </div>
      </div>
      <div
        className={classNames(
          'fr-card__header overflow-hidden rounded-t-lg border-[#e5e7eb]',
          { 'border-b': !backgroundColor }
        )}
      >
        <div className="fr-card__img duration-700">
          {image ? (
            image
          ) : (
            <Image
              className="fr-responsive-image w-full"
              src="/placeholder.svg"
              alt="pas d'image disponible"
              width={354}
              height={201}
            />
          )}
        </div>
        {!!badge && (
          <div className="absolute top-0 left-0 p-3">
            <Badge title={badge} state="standard" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCardDSFR;
