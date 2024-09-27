/* eslint-disable react/no-unescaped-entities */
import {useSearchParams} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactState,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import {
  Alert,
  Button,
  PanierOngletName,
  SITE_BASE_URL,
  Tab,
  Tabs,
} from '@tet/ui';
import ListeActionsFiltrees from './ListeActionsFiltrees';
import ListeVide from './ListeVide';
import FiltresActions from '@tet/panier/components/FiltresActions';

const getTabLabel = (
  tab: {label: string; status: string | null},
  actionsNb: number,
) => {
  if (tab.status !== null) {
    if (actionsNb > 1 || tab.status === 'en_cours') {
      return `${actionsNb} ${tab.label.toLowerCase()}`;
    } else {
      return `${actionsNb} ${tab.label
        .slice(0, tab.label.length - 1)
        .toLowerCase()}`;
    }
  }
  return tab.label;
};

type ListeActionsProps = {
  actionsListe: ActionImpactState[];
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
  sansFiltreCompetences: boolean;
  onToggleSelected: (actionId: number, selected: boolean) => void;
  onUpdateStatus: (actionId: number, statusId: string | null) => void;
  onChangeTab: (tab: PanierOngletName) => void;
};

const ListeActions = ({
  actionsListe,
  budgets,
  temps,
  thematiques,
  sansFiltreCompetences,
  onToggleSelected,
  onUpdateStatus,
  onChangeTab,
}: ListeActionsProps) => {
  const searchParams = useSearchParams();

  const tabsList: {
    label: string;
    shortName: PanierOngletName;
    status: string | null;
  }[] = [
    {label: 'Sélection', shortName: 'selection', status: null},
    {label: 'Réalisées', shortName: 'réalisées', status: 'realise'},
    {
      label: 'En cours de réalisation',
      shortName: 'en cours',
      status: 'en_cours',
    },
  ];

  return (
    <Tabs
      onChange={activeTab => onChangeTab(tabsList[activeTab].shortName)}
      className="grow flex flex-col"
      tabPanelClassName="grow flex flex-col"
      tabsListClassName="!justify-start mb-0"
    >
      {...tabsList.map(tab => {
        const actionsFiltrees = actionsListe.filter(
          a =>
            ((!a.statut && a.statut === tab.status) ||
              (a.statut && a.statut.categorie_id === tab.status)) &&
            (tab.status || !a.isinpanier),
        );

        return (
          <Tab key={tab.label} label={getTabLabel(tab, actionsFiltrees.length)}>
            <FiltresActions
              {...{budgets, temps, thematiques, sansFiltreCompetences}}
            />

            {!tab.status &&
            !actionsFiltrees.length &&
            searchParams.size === 0 ? (
              <ListeVide success />
            ) : (!!tab.status || searchParams.size !== 0) &&
              !actionsFiltrees.length ? (
              <ListeVide />
            ) : (
              <>
                {(tab.status === 'en_cours' || tab.status === 'realise') && (
                  <Alert
                    className="mb-6"
                    title="Souhaitez-vous ajouter ces actions à votre panier ?"
                    footer={
                      tab.status === 'realise' ? (
                        <div className="inline">
                          Valorisez ces actions "réalisées" sur l'&nbsp;
                          <Button
                            className="inline-flex mr-1"
                            variant="underlined"
                            href={`${SITE_BASE_URL}/outil-numerique`}
                            external
                          >
                            outil numérique
                          </Button>
                          aux côtés des actions en cours et à venir pour
                          constituer et piloter un plan d'action sur l'outil
                          numérique. Il vous suffit de cocher la case "Ajouter
                          les actions classées comme “réalisées” au niveau du
                          panier à droite.
                        </div>
                      ) : (
                        <div className="inline">
                          Pour retrouver ces actions "en cours" sur l'&nbsp;
                          <Button
                            className="inline-flex mr-1"
                            variant="underlined"
                            href={`${SITE_BASE_URL}/outil-numerique`}
                            external
                          >
                            outil numérique
                          </Button>
                          et les piloter, il vous suffit de cocher la case
                          "Ajouter les actions classées comme “en cours” au
                          niveau du panier à droite.
                        </div>
                      )
                    }
                  />
                )}
                <ListeActionsFiltrees
                  actionsListe={actionsFiltrees}
                  onUpdateStatus={onUpdateStatus}
                  onToggleSelected={onToggleSelected}
                  {...{budgets, temps}}
                />
              </>
            )}
          </Tab>
        );
      })}
    </Tabs>
  );
};

export default ListeActions;
