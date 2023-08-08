import classNames from 'classnames';

type BlogCardProps = {
  title: string;
  description: string;
  imageSrc?: string;
  href?: string;
};

/**
 * Carte avec un affichage de type article de blog
 * Style DSFR
 */

const BlogCard = ({title, description, imageSrc, href}: BlogCardProps) => {
  return (
    <div className={classNames('fr-card', {'fr-enlarge-link': !!href})}>
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h3 className="fr-card__title">
            {href ? <a href={href}>{title}</a> : <>{title}</>}
          </h3>
          <p className="fr-card__desc">{description}</p>
        </div>
      </div>
      <div className="fr-card__header">
        <div className="fr-card__img border-b border-[#e5e7eb]">
          <picture>
            <img
              className="fr-responsive-img"
              src={imageSrc ? imageSrc : 'placeholder.png'}
              alt=""
            />
          </picture>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
