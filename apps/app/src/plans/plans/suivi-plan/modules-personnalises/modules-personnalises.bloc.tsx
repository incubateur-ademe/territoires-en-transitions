'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { FichesActionCountByCard } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.card';
import { useDeleteSuiviPlanModule } from '../data/use-delete-suivi-plan-module';
import { useListSuiviPlanModules } from '../data/use-list-suivi-plan-modules';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { SuiviPlanModuleModal } from './suivi-plan-module.modal';

export const ModulesPersonnalisesBloc = ({ planId }: { planId: number }) => {
  const collectivite = useCurrentCollectivite();
  const canEdit = collectivite.hasCollectivitePermission('plans.mutate');
  const { data: modules, isLoading } = useListSuiviPlanModules({ planId });
  const { mutate: deleteModule } = useDeleteSuiviPlanModule();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <SuiviPlanBloc
      titre={appLabels.suiviPlanModulesPersonnalises}
      sousTitre={null}
      dataTest="plans.suivi.modules-personnalises"
      actions={
        canEdit && (
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            dataTest="plans.suivi.modules-personnalises.ajouter"
          >
            {appLabels.ajouterModulePersonnalise}
          </Button>
        )
      }
    >
      {isLoading ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules?.map((module) => (
            <FichesActionCountByCard
              key={module.id}
              module={module}
              canEdit={canEdit}
              onDelete={() => deleteModule({ planId, moduleId: module.id })}
              renderEditModal={(openState) => (
                <SuiviPlanModuleModal
                  planId={planId}
                  module={module}
                  openState={openState}
                />
              )}
            />
          ))}
        </div>
      )}
      {isAddOpen && (
        <SuiviPlanModuleModal
          planId={planId}
          openState={{ isOpen: isAddOpen, setIsOpen: setIsAddOpen }}
        />
      )}
    </SuiviPlanBloc>
  );
};
