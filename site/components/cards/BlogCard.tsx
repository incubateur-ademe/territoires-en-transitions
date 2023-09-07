import classNames from 'classnames';
import {getLocalDateString} from 'src/utils/getLocalDateString';

type BlogCardProps = {
  title: string;
  date?: Date;
  description?: string;
  image?: React.ReactNode;
  badge?: string;
  href?: string;
  backgroundColor?: string;
};

/**
 * Carte avec un affichage de type article de blog
 * Style DSFR
 */

const BlogCard = ({
  title,
  date,
  description,
  image,
  badge,
  href,
  backgroundColor,
}: BlogCardProps) => {
  return (
    <div
      className={classNames('fr-card fr-card--no-border border rounded-lg', {
        'fr-enlarge-link': !!href,
      })}
      style={{
        backgroundColor: backgroundColor ? backgroundColor : '#fff',
        borderColor: backgroundColor ? backgroundColor : '#e5e7eb',
      }}
    >
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h3 className="fr-card__title">
            {href ? <a href={href}>{title}</a> : <>{title}</>}
          </h3>
          {description && <p className="fr-card__desc">{description}</p>}
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
          {'border-b': !backgroundColor},
        )}
      >
        <div className="fr-card__img duration-700">
          {image ? (
            image
          ) : (
            <picture>
              <img
                className="fr-responsive-image w-full"
                src="placeholder.png"
                alt="pas d'image disponible"
              />
            </picture>
          )}
        </div>
        {badge && (
          <div className="fr-badges-group">
            <p className="fr-badge fr-badge--blue-ecume">{badge}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCard;
