import { useState } from 'react';
import classNames from 'classnames';
import { Icon, IconValue } from '@tet/ui/design-system/Icon';

type AccordionType = {
  id?: string;
  /** Icône ajoutée avant le titre */
  icon?: IconValue;
  /** Pour changer la position de l'icône */
  iconPosition?: 'left' | 'right';
  /** Titre */
  title: string;
  /** Contenu (chaîne ou composant React personnalisé) */
  content: string | React.ReactNode;
  /** Permet de styler le contenu (ignoré si le contenu n'est pas une chaîne) */
  contentClassname?: string;
  /** Pour afficher un texte optionnel à côté du titre */
  subtitle?: string;
};

/** Styles du container autour du contenu quand l'accordéon est déplié */
export const ACCORDION_CONTENT_STYLE =
  'px-10 py-6 border border-t-0 border-grey-4 rounded-b-lg text-grey-8 [&_a]:break-all';

/**
 * Affiche un contenu complémentaire
 */
export const AccordionControlled = ({
  icon,
  iconPosition = 'left',
  id,
  title,
  content,
  contentClassname,
  expanded,
  setExpanded,
  subtitle,
}: AccordionType & {
  /** le contenu est visible */
  expanded: boolean;
  /** appelée pour déplier/replier le contenu */
  setExpanded: (value: boolean) => void;
}) => {
  return (
    <div>
      {/** EN-TËTE */}
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
          'border border-grey-4 rounded-lg flex gap-3 px-6 py-4 font-bold text-primary-10 hover:bg-primary-1',
          {
            'border-primary-2 rounded-b-none bg-primary-2': expanded,
            'bg-white': !expanded,
          }
        )}
      >
        {/** picto indiquant l'état ouvert/fermé */}
        <Icon
          icon="arrow-right-s-line"
          className={classNames('text-primary transition-transform', {
            'transform: rotate-90': expanded,
          })}
        />
        {/** icône optionnelle avant le titre */}
        {!!icon && iconPosition === 'left' && (
          <Icon icon={icon} className="text-primary" />
        )}
        <div className="-mt-0.5">
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
      </div>

      {/** CONTENU */}
      {!!expanded &&
        (typeof content === 'string' ? (
          <div
            className={classNames(ACCORDION_CONTENT_STYLE, contentClassname)}
            id={id}
          >
            {content}
          </div>
        ) : (
          content
        ))}
    </div>
  );
};

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
