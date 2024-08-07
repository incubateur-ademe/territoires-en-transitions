import {Link, useParams} from 'react-router-dom';
import {
  indicateurIdParam,
  indicateurIdentiantReferentielParam,
} from 'app/paths';
import {FiltersAndGrid} from './lists/FiltersAndGrid';
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

// id d'un indicateur en cours de création
export const ID_NOUVEAU = -1;

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

/** Affiche le détail d'un indicateur */
const IndicateurDetail = (
  props:
    | {
        indicateurId: number;
        isPerso: true;
      }
    | {indicateurId: number | string; isPerso: false}
) => {
  const {indicateurId, isPerso} = props;
  if (indicateurId === ID_NOUVEAU) {
    return <IndicateurPersoNouveau className="fr-p-6w" />;
  }
  if (isPerso) return <IndicateurPersonnalise indicateurId={indicateurId} />;
  return <IndicateurPredefini indicateurId={indicateurId} />;
};

/**
 * Affiche la barre de navigation latérale et la liste des indicateurs ou le
 * détail d'un indicateur
 */
const OldIndicateurs = () => {
  const collectivite = useCurrentCollectivite();

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

  if (!collectivite) {
    return null;
  }

  return (
    <CollectivitePageLayout
      sideNav={{
        links: generateIndicateursNavLinks(collectivite.collectivite_id),
        actions: !collectivite.readonly && (
          <Link
            data-test="create-perso"
            className="fr-btn fr-btn--tertiary"
            to={makeCollectiviteIndicateursUrl({
              collectiviteId: collectivite.collectivite_id,
              indicateurView: 'perso',
              indicateurId: ID_NOUVEAU,
            })}
          >
            Créer un indicateur
          </Link>
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
          <IndicateurDetail
            indicateurId={indicateurId as number}
            isPerso={isPerso}
          />
        ) : (
          <>
            <HeaderIndicateursList view={view} />
            <div className="px-10 py-8">
              <section className="flex flex-col">
                <FiltersAndGrid view={view} />
              </section>
            </div>
          </>
        )}
      </div>
    </CollectivitePageLayout>
  );
};

export default OldIndicateurs;
