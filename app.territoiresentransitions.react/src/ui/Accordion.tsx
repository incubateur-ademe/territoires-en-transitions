import DOMPurify from 'dompurify';
import {useToggle} from 'ui/shared/useToggle';

export type TAccordionProps = {
  /** classes css supplémentaires */
  className?: string;
  /** identifiant dans le dom */
  id: string;
  /** titre de l'accordéon */
  titre: string;
  /** contenu de l'accordéon */
  html: string;
  /** état initial (par défaut false = replié) */
  initialState?: boolean;
};

/** Affiche une description détaillée dans un composant accordéon  */
export const Accordion = (props: TAccordionProps) => {
  const {className, id, titre, html, initialState} = props;
  const [expanded, toggle] = useToggle(initialState || false);

  return (
    <section className={`fr-accordion ${className || ''}`}>
      <h3 className="fr-accordion__title">
        <button
          className="fr-accordion__btn"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => toggle()}
        >
          {titre}
          <i className="fr-fi-information-fill fr-text-default--info fr-mr-3v" />
        </button>
      </h3>
      <div
        className={`fr-collapse${expanded ? '--expanded' : ''}`}
        id={id}
        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(html)}}
      />
    </section>
  );
};
