import {
  indicateurIdentiantReferentielParam,
  indicateurIdParam,
  indicateurViewParam,
  IndicateurViewParamOption,
  makeCollectiviteTousLesIndicateursUrl,
} from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { redirect } from 'next/navigation';
import { useParams } from 'react-router-dom';
import { IndicateurPersonnalise } from './IndicateurPersonnalise';
import { IndicateurPredefini } from './IndicateurPredefini';

/**
 * Affiche le détail d'un indicateur
 */
const Indicateur = () => {
  const collectiviteId = useCollectiviteId();

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
    redirect(
      makeCollectiviteTousLesIndicateursUrl({
        collectiviteId: collectiviteId!,
      })
    );
  }

  return (
    <div
      className="w-full"
      data-test={
        indicateurId !== undefined ? `ind-${indicateurId}` : `ind-v-${view}`
      }
    >
      {isPerso ? (
        <IndicateurPersonnalise indicateurId={indicateurId as number} />
      ) : (
        <IndicateurPredefini indicateurId={indicateurId} />
      )}
    </div>
  );
};

export default Indicateur;
