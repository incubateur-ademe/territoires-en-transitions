import classNames from 'classnames';
import {HTMLAttributes} from 'react';
import {AnchorHTMLProps, DivHTMLProps, isAnchor} from 'utils/types';

/** Types custom de Card */
type BaseCardProps = {
  /** En-tête, sous forme d'une chaîne de caractères ou d'un noeud React */
  header?: string | React.ReactNode;
  /** Contenu principal de la carte */
  children?: string | React.ReactNode;
  /** Footer, sous forme d'une chaîne de caractères ou d'un noeud React */
  footer?: string | React.ReactNode;
  /** Initialise l'état de sélection de la carte */
  isSelected?: boolean;
  /** Indique si la carte est désactivée */
  disabled?: boolean;
};

/** Type carte bouton */
type DivCardProps = BaseCardProps & DivHTMLProps;
/** Type carte lien */
type AnchorCardProps = BaseCardProps & AnchorHTMLProps;

/** Props du composant générique <Card> */
type CardProps = DivCardProps | AnchorCardProps;

/** Affiche une carte avec header et/ou footer
 * Pour appliquer des classnames au header ou au footer en fonction
 * des actions sur la carte, utiliser le préfixe `group-*:`
 *
 * Donner une prop `href` pour transformer la carte en lien
 */
export const Card = ({
  children,
  header,
  footer,
  isSelected,
  className,
  onClick,
  disabled,
  ...otherProps
}: CardProps & HTMLAttributes<HTMLDivElement>) => {
  const hasHoverEffect = (isSelected !== undefined || !!onClick) && !disabled;

  const appliedClassname = classNames(
    'p-7 m-px border bg-white rounded-lg flex flex-col gap-4 text-primary-9 text-base font-bold group',
    {
      'hover:cursor-pointer hover:shadow-card': hasHoverEffect,
      'hover:border-grey-4': hasHoverEffect && !isSelected,
      // default
      'border-grey-3': !isSelected,
      '!m-0 border-2 border-info-1': isSelected,
    },
    className
  );

  if (isAnchor(otherProps)) {
    return (
      <a
        {...otherProps}
        className={classNames('bg-none after:hidden', appliedClassname)}
      >
        <CardContent header={header} footer={footer} children={children} />
      </a>
    );
  } else {
    return (
      <div
        {...otherProps}
        className={appliedClassname}
        onClick={!disabled ? onClick : undefined}
      >
        <CardContent header={header} footer={footer} children={children} />
      </div>
    );
  }
};

const CardContent = ({header, footer, children}: BaseCardProps) => (
  <>
    {!!header && (
      <div className="text-primary-8 text-sm font-bold">{header}</div>
    )}

    {children}

    {!!footer && (
      <div className="text-primary-8 text-sm font-bold mt-auto">{footer}</div>
    )}
  </>
);
