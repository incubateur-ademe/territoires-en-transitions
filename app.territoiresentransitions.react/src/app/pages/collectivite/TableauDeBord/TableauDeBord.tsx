import { Route } from 'react-router-dom';

import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import Collectivite from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/Collectivite';
import ModulePageRoutes from '@/app/app/pages/collectivite/TableauDeBord/ModulePageRoutes';
import {
  collectiviteTDBCollectivitePath,
  collectiviteTDBModulePath,
  collectiviteTDBPersonnelPath,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PageContainer from '@/ui/components/layout/page-container';
import { useState } from 'react';
import ModalFichesActionCountByEdition from './Collectivite/ModuleFichesActionCountBy/ModalFichesActionCountByEdition';
import Personnel from './Personnel/Personnel';
import TdbVide from './components/TdbVide';
import View from './components/View';

/** Tableau de bord plans d'action */
const TableauDeBord = () => {
  const { data: plansActions } = usePlansActionsListe({});
  const collectivite = useCurrentCollectivite();
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  const isEmpty = plansActions?.plans.length === 0;

  return (
    <PageContainer>
      {/** Tableau de bord personnel */}
      <Route exact path={collectiviteTDBPersonnelPath}>
        <View
          view={'personnel'}
          title="Mon suivi personnel"
          description="Ce tableau de bord est personnel afin de suivre mes plans d'action."
        >
          {isEmpty ? <TdbVide /> : <Personnel />}
        </View>
      </Route>
      {/** Tableau de bord de la collectivité */}
      <Route exact path={collectiviteTDBCollectivitePath}>
        <View
          view={'collectivite'}
          title="Le tableau de bord collaboratif de la collectivité"
          description="Ce tableau de bord est destiné à l'ensemble des personnes de la collectivité et peut être modifié par les administrateurs."
          btnProps={
            collectivite?.niveauAcces === 'admin'
              ? {
                  size: 'sm',
                  children: 'Ajouter un module personnalisé',
                  onClick: () => {
                    setIsAddModuleModalOpen(true);
                  },
                }
              : undefined
          }
        >
          {collectivite?.niveauAcces === 'admin' && isAddModuleModalOpen && (
            <ModalFichesActionCountByEdition
              openState={{
                isOpen: isAddModuleModalOpen,
                setIsOpen: setIsAddModuleModalOpen,
              }}
            />
          )}
          {isEmpty ? <TdbVide /> : <Collectivite />}
        </View>
      </Route>
      {/** Modules */}
      <Route path={collectiviteTDBModulePath}>
        <ModulePageRoutes />
      </Route>
    </PageContainer>
  );
};

export default TableauDeBord;
