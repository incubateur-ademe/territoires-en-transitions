import ButtonWithLink from '@components/buttons/ButtonWithLink';
import classNames from 'classnames';

type CardProps = {
  title: string;
  step?: number | string;
  description: string;
  button?: {
    title: string;
    href: string;
    secondary?: boolean;
    external?: boolean;
  };
  image?: React.ReactNode;
  className?: string;
};

/**
 * Carte générique
 * Permet l'affichage d'un titre, d'un contenu, avec ou sans
 * image, step et bouton
 */

const Card = ({
  title,
  step,
  description,
  button,
  image,
  className,
}: CardProps) => (
  <div
    className={classNames(
      'bg-white p-8 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-8',
      className,
    )}
  >
    {!!image && <div>{image}</div>}
    <div
      className={classNames('h-full flex flex-col justify-between', {
        'col-span-2': !!image,
        'col-span-3': !image,
      })}
    >
      <div>
        {step && (
          <div className="w-[40px] h-[40px] rounded-full bg-black text-white text-center text-[1.375rem] leading-[40px] font-bold mb-6">
            {step}
          </div>
        )}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {button && (
        <ButtonWithLink
          href={button.href}
          secondary={button.secondary}
          external={button.external}
          rounded
          fullWidth
        >
          {button.title}
        </ButtonWithLink>
      )}
    </div>
  </div>
);

export default Card;
