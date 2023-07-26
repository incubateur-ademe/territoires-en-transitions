import {Link, useParams} from 'react-router-dom';
import {indicateurIdParam} from 'app/paths';
import {IndicateursPersonnalisesList} from './lists/IndicateursPersonnalisesList';
import {IndicateursPredefinisList} from './lists/IndicateursPredefinisList';
import {IndicateursClesList} from './lists/IndicateursClesList';
import {IndicateursSelectionList} from './lists/IndicateursSelectionList';
import {IndicateurPersonnalise} from './IndicateurPersonnalise';
import {IndicateurPredefini} from './IndicateurPredefini';
import {HeaderIndicateursList} from './Header';
import IndicateurPersoNouveau from './IndicateurPersoNouveau';
import {referentielToName} from 'app/labels';
import {
  indicateurViewParam,
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import {SideNavLinks} from 'ui/shared/SideNav';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

// correspondances entre item et libellé
export const VIEW_TITLES: Record<IndicateurViewParamOption, string> = {
  selection: 'Indicateurs prioritaires',
  cles: 'Indicateurs clés',
  //  tous: 'Tous les indicateurs',
  perso: 'Indicateurs personnalisés',
  cae: `Indicateurs ${referentielToName.cae}`,
  eci: `Indicateurs ${referentielToName.eci}`,
  crte: 'Indicateurs Contrat de relance et de transition écologique (CRTE)',
};

// items dans l'ordre de l'affichage voulu
const ITEMS: IndicateurViewParamOption[] = [
  'cles',
  'selection',
  'perso',
  'cae',
  'eci',
  'crte',
];

// génère les liens à afficher dans la navigation latérale
const generateIndicateursNavLinks = (collectiviteId: number): SideNavLinks => {
  return ITEMS.map(indicateurView => ({
    displayName: VIEW_TITLES[indicateurView],
    link: makeCollectiviteIndicateursUrl({collectiviteId, indicateurView}),
  }));
};

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
  const collectivite = useCurrentCollectivite();

  const params = useParams<{
    [indicateurViewParam]?: IndicateurViewParamOption;
    [indicateurIdParam]?: string;
  }>();
  const indicateurId = params[indicateurIdParam];
  const view = params[indicateurViewParam] || 'perso';
  const isPerso = view === 'perso';

  if (!collectivite) {
    return null;
  }

  return (
    <CollectivitePageLayout
      sideNav={{
        links: generateIndicateursNavLinks(collectivite.collectivite_id),
        actions: !collectivite.readonly && (
          <div className="mt-8">
            <Link
              data-test="create-perso"
              className="fr-btn fr-btn--tertiary fr-ml-4w"
              to={makeCollectiviteIndicateursUrl({
                collectiviteId: collectivite.collectivite_id,
                indicateurView: 'perso',
                indicateurId: 'nouveau',
              })}
            >
              Créer un indicateur
            </Link>
          </div>
        ),
      }}
    >
      <div
        className="w-full"
        data-test={
          indicateurId !== undefined ? `ind-${indicateurId}` : `ind-v-${view}`
        }
      >
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
    </CollectivitePageLayout>
  );
};

export default Indicateurs;
