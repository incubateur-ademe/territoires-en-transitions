import classNames from 'classnames';
import { forwardRef, useState } from 'react';
import { Icon, IconValue } from '../../design-system/Icon';

export type AccordionType = {
  dataTest?: string;
  id?: string;
  ref?: React.Ref<HTMLDivElement>;
  /** Icône ajoutée avant le titre */
  icon?: IconValue;
  /** Pour changer la position de l'icône */
  iconPosition?: 'left' | 'right';
  /** Titre */
  title: string;
  /** Pour afficher un texte optionnel à côté du titre */
  subtitle?: string;
  /** Affiche un contenu supplémentaire à la fin de l'en-tête */
  headerContent?: React.ReactNode;
  /** Contenu (chaîne ou composant React personnalisé) */
  content: string | React.ReactNode;
  /** Permet de styler le conteneur */
  containerClassname?: string;
  /** Permet de styler l'en-tête */
  headerClassname?: string;
  /** Permet de styler la flèche d'ouverture */
  arrowClassname?: string;
  /** Permet de styler le contenu (ignoré si le contenu n'est pas une chaîne) */
  contentClassname?: string;
};

/**
 * Affiche un contenu complémentaire
 */
export const AccordionControlled = forwardRef<
  HTMLDivElement,
  AccordionType & {
    /** le contenu est visible */
    expanded: boolean;
    /** appelée pour déplier/replier le contenu */
    setExpanded: (value: boolean) => void;
  }
>(
  (
    {
      dataTest,
      id,
      icon,
      iconPosition = 'left',
      title,
      subtitle,
      headerContent,
      content,
      containerClassname,
      headerClassname,
      arrowClassname,
      contentClassname,
      expanded,
      setExpanded,
    },
    ref
  ) => {
    return (
      <div
        data-test={dataTest}
        className={classNames('border-y border-grey-4', containerClassname)}
        ref={ref}
      >
        {/** EN-TÊTE */}
        <div
          role="button"
          tabIndex={0}
          aria-controls={id}
          aria-expanded={expanded}
          onKeyDown={(e) => {
            if (e.code === 'Space') {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
          onClick={() => setExpanded(!expanded)}
          className={classNames(
            'flex gap-3 items-center py-6 font-bold text-base text-primary-9 cursor-pointer',
            headerClassname
          )}
        >
          {/** picto indiquant l'état ouvert/fermé */}
          <Icon
            icon="arrow-right-s-line"
            className={classNames(
              'text-primary transition-transform',
              {
                'transform: rotate-90': expanded,
              },
              arrowClassname
            )}
          />
          {/** icône optionnelle avant le titre */}
          {!!icon && iconPosition === 'left' && (
            <Icon icon={icon} className="text-primary" />
          )}
          <div>
            {/** titre */}
            {title}
            {/** sous-titre */}
            {!!subtitle && (
              <span className="font-normal text-xs mt-2 line-clamp-1">
                {subtitle}
              </span>
            )}
          </div>
          {/** icône optionnelle alignée à droite */}
          {!!icon && iconPosition === 'right' && (
            <Icon icon={icon} className="ml-auto text-primary" />
          )}
          {!!headerContent && <div className="ml-auto">{headerContent}</div>}
        </div>

        {/** CONTENU */}
        {expanded &&
          (typeof content === 'string' ? (
            <div
              className={classNames('px-8 pb-6 text-grey-8', contentClassname)}
              id={id}
            >
              {content}
            </div>
          ) : (
            content
          ))}
      </div>
    );
  }
);
AccordionControlled.displayName = 'AccordionControlled';

export const Accordion = ({
  initialState,
  ...props
}: AccordionType & { initialState?: boolean }) => {
  const [expanded, setExpanded] = useState(initialState || false);

  return (
    <AccordionControlled
      {...props}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
};
