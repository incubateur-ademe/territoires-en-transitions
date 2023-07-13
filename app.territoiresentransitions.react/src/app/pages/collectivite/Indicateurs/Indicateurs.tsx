import {useParams} from 'react-router-dom';
import {
  indicateurIdParam,
  indicateurViewParam,
  IndicateurViewParamOption,
} from 'app/paths';
import {IndicateursNav, VIEW_TITLES} from './IndicateursNav';
import {IndicateursPersonnalisesList} from './lists/IndicateursPersonnalisesList';
import {IndicateursPredefinisList} from './lists/IndicateursPredefinisList';
import {IndicateursClesList} from './lists/IndicateursClesList';
import {IndicateursSelectionList} from './lists/IndicateursSelectionList';
import {IndicateurPersonnalise} from './IndicateurPersonnalise';
import {IndicateurPredefini} from './IndicateurPredefini';
import {HeaderIndicateursList} from './Header';
import IndicateurPersoNouveau from './IndicateurPersoNouveau';

export const viewTitles: Record<IndicateurViewParamOption, string> = {
  ...VIEW_TITLES,
  crte: 'Indicateurs CRTE',
};

/**
 * Affiche la liste des indicateurs
 */
const IndicateursList = (props: {view: IndicateurViewParamOption}) => {
  const {view} = props;
  if (view === 'perso') return <IndicateursPersonnalisesList />;
  if (view === 'cles') return <IndicateursClesList />;
  if (view === 'selection') return <IndicateursSelectionList />;
  return <IndicateursPredefinisList referentiel={view} />;
};

/** Affiche le détail d'un indicateur */
const IndicateurDetail = (props: {indicateurId: string; isPerso: boolean}) => {
  const {indicateurId, isPerso} = props;
  if (indicateurId === 'nouveau') {
    return <IndicateurPersoNouveau className="fr-p-6w" />;
  }
  const Indicateur = isPerso ? IndicateurPersonnalise : IndicateurPredefini;
  return <Indicateur indicateurId={indicateurId} />;
};

/**
 * Affiche la barre de navigation latérale et la liste des indicateurs ou le
 * détail d'un indicateur
 */
const Indicateurs = () => {
  const params = useParams<{
    [indicateurViewParam]?: IndicateurViewParamOption;
    [indicateurIdParam]?: string;
  }>();
  const indicateurId = params[indicateurIdParam];
  const view = params[indicateurViewParam] || 'perso';
  const isPerso = view === 'perso';

  return (
    <div className="fr-container !px-0 flex">
      <IndicateursNav />
      <div className="w-full">
        {indicateurId !== undefined ? (
          <IndicateurDetail indicateurId={indicateurId} isPerso={isPerso} />
        ) : (
          <>
            <HeaderIndicateursList view={view} />
            <div className="px-10 py-8">
              <section className="flex flex-col">
                <IndicateursList view={view} />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Indicateurs;
