import {useState} from 'react';
import classNames from 'classnames';
import {Icon, IconValue} from '@design-system/Icon';

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
  /** Indique un contenu privé (affiche un message d'info à l'utilisateur mais
   * ne permet pas de faire apparaître le contenu) */
  onlyForMembers?: boolean;
};

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
  onlyForMembers,
}: AccordionType & {
  /** le contenu est visible */
  expanded: boolean;
  /** appelée pour déplier/replier le contenu */
  setExpanded: (value: boolean) => void;
}) => {
  return (
    <>
      {/** EN-TËTE */}
      <div
        role="button"
        aria-controls={id}
        aria-expanded={expanded}
        onClick={() => setExpanded(onlyForMembers ? false : !expanded)}
        className={classNames(
          'border border-grey-4 rounded-lg h-16 flex items-center px-8 font-bold text-primary-10  hover:bg-primary-1',
          {'border-transparent rounded-b-none bg-primary-2': expanded}
        )}
      >
        {/** picto indiquant l'état ouvert/fermé */}
        <Icon
          icon="arrow-right-s-line"
          className={classNames('mr-3 text-primary transition-transform', {
            'transform: rotate-90': expanded,
          })}
        />
        {/** icône optionnelle avant le titre */}
        {!!icon && iconPosition === 'left' && (
          <Icon icon={icon} className="mr-3 text-primary" />
        )}
        {/** titre */}
        {title}
        {/** message mode "privé" */}
        {!!onlyForMembers && (
          <span className="font-normal text-xs ml-3 line-clamp-1">
            Cette section est visible uniquement par les membres de votre
            collectivité
          </span>
        )}
        {/** icône optionnelle alignée à droite */}
        {!!icon && iconPosition === 'right' && (
          <Icon icon={icon} className="ml-auto text-primary" />
        )}
      </div>

      {/** CONTENU */}
      {!!expanded &&
        !onlyForMembers &&
        (typeof content === 'string' ? (
          <div className={classNames('p-4', contentClassname)} id={id}>
            {content}
          </div>
        ) : (
          content
        ))}
    </>
  );
};

export const Accordion = ({
  initialState,
  ...props
}: AccordionType & {initialState?: boolean}) => {
  const [expanded, setExpanded] = useState(initialState || false);

  return (
    <AccordionControlled
      {...props}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
};
