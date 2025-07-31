import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';

export type TAccordionProps = {
  className?: string;
  id: string;
  dataTest?: string;
  titre: string;
  html: string | React.ReactNode;
  initialState?: boolean;
  icon?: string;
};

/**
 * Affiche une description détaillée dans un composant accordéon
 *
 * @param className
 * classes css supplémentaires
 * @param id
 * identifiant dans le dom
 * @param titre
 * titre de l'accordéon
 * @param html
 * contenu de l'accordéon
 * @param initialState
 * état initial (par défaut false = replié)
 * @param icon
 * icône à afficher à gauche du titre
 */

export const Accordion = (props: TAccordionProps) => {
  const { initialState, ...other } = props;
  const [expanded, setExpanded] = useState(initialState ?? false);

  useEffect(() => setExpanded(initialState ?? false), [initialState]);
  return (
    <AccordionControlled
      {...other}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
};

export const AccordionControlled = (
  props: Omit<TAccordionProps, 'initialState'> & {
    expanded: boolean;
    setExpanded: (value: boolean) => void;
  }
) => {
  const { className, id, dataTest, titre, html, expanded, setExpanded } = props;

  const contentClassName = classNames({
    'fr-collapse--expanded py-3 px-4': expanded,
    'fr-collapse': !expanded,
  });

  return (
    <section data-test={dataTest} className={`fr-accordion ${className || ''}`}>
      <h3 className="fr-accordion__title">
        <button
          className="fr-accordion__btn font-normal"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {titre}
        </button>
      </h3>
      {typeof html === 'string' ? (
        <div
          className={contentClassName}
          id={id}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      ) : (
        <div className={contentClassName} id={id}>
          {html}
        </div>
      )}
    </section>
  );
};
