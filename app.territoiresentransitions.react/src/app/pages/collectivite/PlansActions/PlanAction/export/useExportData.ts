import {useExportTemplateBase} from 'utils/exportXLSX';
import {usePlanAction} from '../data/usePlanAction';
import {useActionListe} from '../../FicheAction/data/options/useActionListe';
import {ConfigPlanAction} from './config';
import {useAnnexesPlanAction} from '../data/useAnnexesPlanAction';

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

  // charge les annexes associées aux fiches du plan d'action
  const {data: annexes, isLoading: isLoadingAnnexes} =
    useAnnexesPlanAction(plan_id);
  // fonction exportée pour donner accès au libellé (nom du fichier ou titre du lien) d'une annexe
  const getAnnexeLabel = (annexe_id: number) => {
    const annexe = annexes?.find(({id}) => id === annexe_id);
    return annexe?.lien?.url || annexe?.fichier?.filename || null;
  };

  const isLoading =
    isLoadingTemplate ||
    isLoadingPlanAction ||
    isLoadingActions ||
    isLoadingAnnexes;

  const isValidData = Boolean(planAction && actionListe);

  return {
    isLoading,
    isValidData,
    loadTemplate,
    template: template || null,
    getActionLabel,
    getAnnexeLabel,
    config: ConfigPlanAction,
    planAction,
  };
};

export type TExportData = ReturnType<typeof useExportData>;
