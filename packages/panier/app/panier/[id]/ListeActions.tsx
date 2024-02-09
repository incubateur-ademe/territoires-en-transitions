import {useState} from 'react';
import {ActionImpactCategorie, ActionImpactState} from '@tet/api';
import {Alert, Tab, Tabs} from '@tet/ui';
import ListeActionsFiltrees from './ListeActionsFiltrees';
import ListeVide from './ListeVide';

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
  statuts: ActionImpactCategorie[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
  updateStatus: (actionId: number, statusId: string | null) => void;
};

const ListeActions = ({
  actionsListe,
  statuts,
  onToggleSelected,
  updateStatus,
}: ListeActionsProps) => {
  const [openAlert, setOpenAlert] = useState(true);

  const tabsList = [
    {label: 'Sélection', status: null},
    {label: 'Réalisées', status: 'realise'},
    {label: 'En cours de réalisation', status: 'en_cours'},
    {label: 'Non pertinentes', status: 'non_pertinent'},
  ];

  return (
    <div className="my-4">
      <Tabs>
        {...tabsList.map(tab => {
          const actionsFiltrees = actionsListe.filter(
            a =>
              (!a.statut && a.statut === tab.status) ||
              (a.statut && a.statut.categorie_id === tab.status),
          );

          return (
            <Tab
              key={tab.label}
              label={getTabLabel(tab, actionsFiltrees.length)}
            >
              <Alert
                isOpen={openAlert}
                onClose={() => setOpenAlert(false)}
                title="Nous avons personnalisé la liste selon votre territoire et vos
                compétences. Vous pouvez modifier grâce aux filtres"
                classname="mb-8"
              />
              {!tab.status && !actionsFiltrees.length ? (
                <ListeVide />
              ) : (
                <ListeActionsFiltrees
                  actionsListe={actionsFiltrees}
                  statuts={statuts}
                  updateStatus={updateStatus}
                  onToggleSelected={onToggleSelected}
                />
              )}
            </Tab>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ListeActions;
