import { Panier } from '@tet/api';
import FiltresActions from '@/panier/components/FiltresActions';
import { Alert, Button, SITE_BASE_URL, Tab, Tabs } from '@tet/ui';
import { useSearchParams } from 'next/navigation';
import { ContenuListesFiltre, PanierOngletName } from '../FiltresActions/types';
import ListeActionsFiltrees from './ListeActionsFiltrees';
import ListeVide from './ListeVide';

const getTabLabel = (
  tab: { label: string; labelOne?: string; status: string | null },
  actionsNb: number
) => {
  if (actionsNb === 1 && tab.labelOne) {
    return `1 ${tab.labelOne.toLowerCase()}`;
  }

  if (actionsNb > 1 || tab.status === 'en_cours') {
    return `${actionsNb} ${tab.label.toLowerCase()}`;
  } else {
    return `${actionsNb} ${tab.label
      .slice(0, tab.label.length - 1)
      .toLowerCase()}`;
  }
};

type ListeActionsProps = {
  panier: Panier;
  onToggleSelected: (actionId: number, selected: boolean) => void;
  onUpdateStatus: (actionId: number, statusId: string | null) => void;
  onChangeTab: (tab: PanierOngletName) => void;
} & ContenuListesFiltre;

const ListeActions = ({
  panier,
  budgets,
  temps,
  thematiques,
  typologies,
  onToggleSelected,
  onUpdateStatus,
  onChangeTab,
}: ListeActionsProps) => {
  const searchParams = useSearchParams();

  const tabsList: {
    label: string;
    labelOne?: string;
    shortName: PanierOngletName;
    status: 'realise' | 'en_cours' | 'selection' | 'importees';
  }[] = [
    {
      label: 'Propositions',
      shortName: 'selection',
      status: 'selection',
    },
    { label: 'Réalisées', shortName: 'réalisées', status: 'realise' },
    {
      label: 'En cours de réalisation',
      shortName: 'en cours',
      status: 'en_cours',
    },
  ];

  const actionsDejaImportees = panier.importees;
  if (actionsDejaImportees.length) {
    tabsList.push({
      label: 'Actions déjà importées',
      labelOne: 'Action déjà importée',
      shortName: 'importees',
      status: 'importees',
    });
  }

  return (
    <Tabs
      onChange={(activeTab) => onChangeTab(tabsList[activeTab].shortName)}
      className="grow flex flex-col"
      tabPanelClassName="grow flex flex-col"
      tabsListClassName="!justify-start mb-0"
    >
      {...tabsList.map((tab) => {
        const actionsFiltrees = panier[tab.status];

        return (
          <Tab key={tab.label} label={getTabLabel(tab, actionsFiltrees.length)}>
            <FiltresActions
              {...{
                budgets,
                temps,
                thematiques,
                typologies,
              }}
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
                          constituer et piloter un plan sur l'outil numérique.
                          Il vous suffit de cocher la case "Ajouter les actions
                          classées “réalisées” au niveau du panier à droite.
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
                          "Ajouter les actions classées “en cours” au niveau du
                          panier à droite.
                        </div>
                      )
                    }
                  />
                )}
                {tab.shortName === 'importees' && (
                  <Alert
                    className="mb-4"
                    state="info"
                    title="Ces actions ont déjà été ajoutées à votre plan sur l’outil numérique territoires en transitions, retrouvez les dans votre onglet connecté Plans"
                  />
                )}

                <ListeActionsFiltrees
                  actionsListe={actionsFiltrees}
                  onUpdateStatus={onUpdateStatus}
                  onToggleSelected={onToggleSelected}
                  {...{ budgets, temps }}
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
