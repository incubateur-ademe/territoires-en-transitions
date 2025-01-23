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
import IndicateurDetail from '../detail/IndicateurDetail';

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
    <IndicateurDetail
      dataTest={
        indicateurId !== undefined ? `ind-${indicateurId}` : `ind-v-${view}`
      }
      {...{ indicateurId, isPerso }}
    />
  );
};

export default Indicateur;
