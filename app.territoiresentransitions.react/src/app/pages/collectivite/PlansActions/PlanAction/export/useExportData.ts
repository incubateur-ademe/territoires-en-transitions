import {useExportTemplateBase} from 'utils/exportXLSX';
import {usePlanActionExport} from '../data/usePlanAction';
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
    usePlanActionExport(plan_id);

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
  // fonction exportée pour donner accès aux libellés (nom du fichier ou titre
  // du lien) des annexes d'une fiche
  const getAnnexes = (fiche_id: number | null) => {
    return fiche_id
      ? annexes
          ?.filter(f => f.fiche_id === fiche_id)
          .map(annexe => annexe?.lien?.url || annexe?.fichier?.filename || null)
          .filter(s => !!s)
      : null;
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
    getAnnexes,
    config: ConfigPlanAction,
    planAction,
  };
};

export type TExportData = ReturnType<typeof useExportData>;
