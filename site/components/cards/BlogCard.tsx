import classNames from 'classnames';

type BlogCardProps = {
  title: string;
  date?: Date;
  description?: string;
  image?: React.ReactNode;
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
  href,
  backgroundColor,
}: BlogCardProps) => {
  const getParsedDate = (date: Date): string => {
    let parsedDate = '';
    const newDate = new Date(date);
    parsedDate += `${newDate.getDate()} `;
    parsedDate += `${new Intl.DateTimeFormat('fr-FR', {month: 'long'}).format(
      newDate,
    )} `;
    parsedDate += newDate.getFullYear();
    return parsedDate;
  };

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
            {date && <p className="fr-card__detail">{getParsedDate(date)}</p>}
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
            <picture>{image}</picture>
          ) : (
            <picture>
              <img
                className="fr-responsive-image w-full"
                src="placeholder.png"
                alt=""
              />
            </picture>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
