import {useExportTemplateBase} from 'utils/exportXLSX';
import {usePlanAction} from '../data/usePlanAction';
import {useActionListe} from '../../FicheAction/data/options/useActionListe';
import {ConfigPlanAction} from './config';

/** Fourni les données nécessaires à l'export d'un plan d'action */
export const useExportData = (plan_id: number) => {
  // fonction pour charger et cacher le fichier modèle
  const {
    refetch: loadTemplate,
    data: template,
    isLoading: isLoadingTemplate,
  } = useExportTemplateBase('export_plan_action.xlsx');

  // charge le plan d'action
  const {data: planAction, isLoading: isLoadingPlanAction} =
    usePlanAction(plan_id);

  // charge les données des actions
  const {data: actionListe, isLoading: isLoadingActions} = useActionListe();
  // fonction exportée pour donner accès aux libellés des actions
  const getAction = (action_id: string) =>
    actionListe?.find(a => a.action_id === action_id) || null;
  const getActionLabel = (action_id: string) => {
    const action = getAction(action_id);
    return action
      ? `${action.referentiel} ${action.identifiant} - ${action.nom}`
      : null;
  };

  const isLoading =
    isLoadingTemplate || isLoadingPlanAction || isLoadingActions;

  const isValidData = Boolean(planAction && actionListe);

  return {
    isLoading,
    isValidData,
    loadTemplate,
    template: template || null,
    getActionLabel,
    config: ConfigPlanAction,
    planAction,
  };
};

export type TExportData = ReturnType<typeof useExportData>;
