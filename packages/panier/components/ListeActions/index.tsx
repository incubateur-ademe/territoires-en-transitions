import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactState,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import {Alert, PanierOngletName, Tab, Tabs} from '@tet/ui';
import ListeActionsFiltrees from './ListeActionsFiltrees';
import ListeVide from './ListeVide';
import FiltresActions from '@components/FiltresActions';

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
  onToggleSelected: (actionId: number, selected: boolean) => void;
  onUpdateStatus: (actionId: number, statusId: string | null) => void;
  onChangeTab: (tab: PanierOngletName) => void;
};

const ListeActions = ({
  actionsListe,
  budgets,
  temps,
  thematiques,
  onToggleSelected,
  onUpdateStatus,
  onChangeTab,
}: ListeActionsProps) => {
  const [openAlert, setOpenAlert] = useState(true);
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
      tabsListClassName="!justify-start"
    >
      {...tabsList.map(tab => {
        const actionsFiltrees = actionsListe.filter(
          a =>
            (!a.statut && a.statut === tab.status) ||
            (a.statut && a.statut.categorie_id === tab.status),
        );

        return (
          <Tab key={tab.label} label={getTabLabel(tab, actionsFiltrees.length)}>
            <FiltresActions {...{budgets, temps, thematiques}} />
            <Alert
              isOpen={openAlert}
              onClose={() => setOpenAlert(false)}
              title="Nous avons personnalisé la liste selon votre territoire et votre domaine d'action. Vous pouvez élargir la sélection grâce aux filtres."
              classname="mb-8"
            />
            {!tab.status &&
            !actionsFiltrees.length &&
            searchParams.size === 0 ? (
              <ListeVide success />
            ) : (!!tab.status || searchParams.size !== 0) &&
              !actionsFiltrees.length ? (
              <ListeVide />
            ) : (
              <ListeActionsFiltrees
                actionsListe={actionsFiltrees}
                onUpdateStatus={onUpdateStatus}
                onToggleSelected={onToggleSelected}
                {...{budgets, temps}}
              />
            )}
          </Tab>
        );
      })}
    </Tabs>
  );
};

export default ListeActions;
