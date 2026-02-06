import classNames from 'classnames';
import Link from 'next/link';
import { cn } from '../../utils/cn';
import { DivHTMLProps, isLink, LinkFullProps } from '../../utils/types';

/** Types custom de Card */
type BaseCardProps = {
  /** Id pour les tests */
  dataTest?: string;
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
  /** Pourque le lien ouvre un nouvel onglet */
  external?: boolean;
  /** Classe CSS */
  className?: string;
};

/** Type carte bouton */
type DivCardProps = BaseCardProps & DivHTMLProps;
/** Type carte lien */
type LinkCardProps = BaseCardProps & LinkFullProps;

/** Props du composant générique <Card> */
export type CardProps = DivCardProps | LinkCardProps;

/** Affiche une carte avec header et/ou footer
 * Pour appliquer des classnames au header ou au footer en fonction
 * des actions sur la carte, utiliser le préfixe `group-*:`
 *
 * Donner une prop `href` pour transformer la carte en lien
 */
export const Card = ({
  dataTest,
  children,
  header,
  footer,
  isSelected,
  className,
  disabled,
  external,
  ...otherProps
}: CardProps) => {
  const isLinkElement = isLink(otherProps);

  const hasHoverEffect =
    (isSelected !== undefined ||
      !!otherProps.onClick ||
      (isLinkElement && !!otherProps.href)) &&
    !disabled;

  const appliedClassname = cn(
    'p-7 m-px border bg-white rounded-lg flex flex-col gap-4 text-primary-9 text-base font-bold active:!bg-white group transition',
    {
      'hover:cursor-pointer hover:shadow-card': hasHoverEffect,
      'hover:border-grey-4': hasHoverEffect && !isSelected,
      // default
      'border-grey-3': !isSelected,
      '!m-0 border-2 border-primary-7': isSelected,
      'pointer-events-none': disabled,
    },
    className
  );

  if (isLinkElement) {
    return (
      <Link
        {...otherProps}
        data-test={dataTest}
        className={classNames('bg-none after:hidden', appliedClassname)}
        target={external ? '_blank' : otherProps.target}
        rel={external ? 'noreferrer noopener' : otherProps.rel}
      >
        <CardContent header={header} footer={footer}>
          {children}
        </CardContent>
      </Link>
    );
  } else {
    const divCardProps = { ...otherProps } as DivHTMLProps;
    return (
      <div
        {...divCardProps}
        data-test={dataTest}
        className={appliedClassname}
        onClick={!disabled ? divCardProps.onClick : undefined}
      >
        <CardContent header={header} footer={footer}>
          {children}
        </CardContent>
      </div>
    );
  }
};

const CardContent = ({ header, footer, children }: BaseCardProps) => (
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
