import {useParams} from 'react-router-dom';
import {
  indicateurIdParam,
  indicateurIdentiantReferentielParam,
} from 'app/paths';
import {IndicateurPersonnalise} from './IndicateurPersonnalise';
import {IndicateurPredefini} from './IndicateurPredefini';
import IndicateurPersoNouveau from './IndicateurPersoNouveau';
import {indicateurViewParam, IndicateurViewParamOption} from 'app/paths';

// id d'un indicateur en cours de création
const ID_NOUVEAU = -1;

/**
 * Affiche le détail d'un indicateur
 */
const Indicateur = () => {
  const params = useParams<{
    [indicateurViewParam]?: IndicateurViewParamOption;
    [indicateurIdParam]?: string;
    [indicateurIdentiantReferentielParam]?: string;
  }>();
  let indicateurId, isPerso;
  if (params[indicateurIdParam] !== undefined) {
    indicateurId = parseInt(params[indicateurIdParam]);
    isPerso = true;
  } else {
    indicateurId = params[indicateurIdentiantReferentielParam];
    isPerso = false;
  }
  const view = params[indicateurViewParam] || 'perso';

  if (!indicateurId) {
    return null;
  }

  return (
    <div
      className="w-full"
      data-test={
        indicateurId !== undefined ? `ind-${indicateurId}` : `ind-v-${view}`
      }
    >
      {indicateurId === ID_NOUVEAU ? (
        <IndicateurPersoNouveau className="fr-p-6w" />
      ) : isPerso ? (
        <IndicateurPersonnalise indicateurId={indicateurId as number} />
      ) : (
        <IndicateurPredefini indicateurId={indicateurId} />
      )}
    </div>
  );
};

export default Indicateur;
