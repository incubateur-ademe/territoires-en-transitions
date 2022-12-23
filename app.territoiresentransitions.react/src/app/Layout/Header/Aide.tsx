import {useTracker} from 'core-logic/hooks/useTracker';

/**
 * Ouvre le lien vers le centre d'aide.
 */
export const Aide = () => {
  const tracker = useTracker();
  const onClick = async () => {
    await tracker({fonction: 'aide', action: 'clic'});
  };
  return <a
    data-test="help"
    className="fr-link"
    href="https://aide.territoiresentransitions.fr/fr/"
    target="_blank" rel="noreferrer"
    onClick={onClick}
  >
    <div className="fr-fi-question-line mr-2" />
    Aide
  </a>;
};
