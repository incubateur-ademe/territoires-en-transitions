import { forwardRef, ReactNode, useState } from 'react';
import { Icon, IconValue } from '../../design-system/Icon';
import { cn } from '../../utils/cn';

type AccordionBase = {
  dataTest?: string;
  id?: string;
  ref?: React.Ref<HTMLDivElement>;
  /** Contenu (chaîne ou composant React personnalisé) */
  content: string | React.ReactNode;
  /** Permet de styler le conteneur */
  containerClassname?: string;
  /** Permet de styler le contenu (ignoré si le contenu n'est pas une chaîne) */
  contentClassname?: string;
};

type AccordionWithDefaultHeader = AccordionBase & {
  renderHeader?: never;
  /** Titre */
  title: string;
  /** Pour afficher un texte optionnel à côté du titre */
  subtitle?: string;
  /** Icône ajoutée avant le titre */
  icon?: IconValue;
  /** Pour changer la position de l'icône */
  iconPosition?: 'left' | 'right';
  /** Affiche un contenu supplémentaire à la fin de l'en-tête */
  additionalRightHeaderContent?: React.ReactNode;
  /** Permet de styler l'en-tête */
  headerClassname?: string;
  /** Permet de styler la flèche d'ouverture */
  arrowClassname?: string;
};

type AccordionWithCustomHeader = AccordionBase & {
  /** Render prop pour un en-tête entièrement personnalisé.
   * Reçoit isExpanded et toggleExpand pour gérer l'affichage librement. */
  renderHeader: (props: {
    isExpanded: boolean;
    toggleExpand: () => void;
  }) => ReactNode;
  title?: never;
  subtitle?: never;
  icon?: never;
  iconPosition?: never;
  additionalRightHeaderContent?: never;
  headerClassname?: never;
  arrowClassname?: never;
};

export type AccordionType =
  | AccordionWithDefaultHeader
  | AccordionWithCustomHeader;

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
      additionalRightHeaderContent,
      renderHeader,
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
    const toggleExpand = (): void => setExpanded(!expanded);

    if (renderHeader) {
      return (
        <>
          {renderHeader({ isExpanded: expanded, toggleExpand })}

          {expanded &&
            (typeof content === 'string' ? (
              <div
                className={cn('px-8 pb-6 text-grey-8', contentClassname)}
                id={id}
              >
                {content}
              </div>
            ) : (
              content
            ))}
        </>
      );
    }

    return (
      <div
        data-test={dataTest}
        className={cn('border-y border-grey-3', containerClassname)}
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
              toggleExpand();
            }
          }}
          onClick={toggleExpand}
          className={cn(
            'flex gap-3 items-center py-6 font-bold text-base text-primary-9 cursor-pointer',
            headerClassname
          )}
        >
          <Icon
            icon="arrow-right-s-line"
            className={cn(
              'text-primary transition-transform',
              {
                'transform: rotate-90': expanded,
              },
              arrowClassname
            )}
          />
          {!!icon && iconPosition === 'left' && (
            <Icon icon={icon} className="text-primary" />
          )}
          <div>
            {title}
            {!!subtitle && (
              <span className="font-normal text-xs mt-2 line-clamp-1">
                {subtitle}
              </span>
            )}
          </div>
          {!!icon && iconPosition === 'right' && (
            <Icon icon={icon} className="ml-auto text-primary" />
          )}
          {!!additionalRightHeaderContent && (
            <div className="ml-auto">{additionalRightHeaderContent}</div>
          )}
        </div>

        {/** CONTENU */}
        {expanded &&
          (typeof content === 'string' ? (
            <div
              className={cn('px-8 pb-6 text-grey-8', contentClassname)}
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
