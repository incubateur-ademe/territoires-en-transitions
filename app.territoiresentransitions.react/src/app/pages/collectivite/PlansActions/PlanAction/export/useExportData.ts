import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useExportTemplateBase} from 'utils/exportXLSX';
import {useActionListe} from '../../FicheAction/data/options/useActionListe';
import {ConfigPlanAction} from './config';
import {PlanAction} from '../data/types';
import {
  TFichier,
  TPreuveLienFields,
} from 'ui/shared/preuves/Bibliotheque/types';

/** Fourni les données nécessaires à l'export d'un plan d'action */
export const useExportData = (plan_id: number) => {
  // fonction pour charger et cacher le fichier modèle
  const {
    refetch: loadTemplate,
    data: template,
    isLoading: isLoadingTemplate,
  } = useExportTemplateBase('export_plan_action.xlsx');

  // charge le plan d'action
  const {
    data: planAction,
    isLoading: isLoadingPlanAction,
    refetch: loadPlanAction,
  } = usePlanActionExport(plan_id);

  // charge les données des actions
  const {data: actionListe, isLoading: isLoadingActions} = useActionListe();
  // fonction exportée pour donner accès aux libellés des actions
  const getActionLabel = (action_id: string) => {
    const action = actionListe?.find(a => a.action_id === action_id) || null;
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
    template,
    getActionLabel,
    config: ConfigPlanAction,
    planAction,
    loadPlanAction,
  };
};

export type TExportData = ReturnType<typeof useExportData>;

// charge uniquement à la demande les données du plan d'action et des annexes
// associées
const usePlanActionExport = (plan_id: number) => {
  return useQuery(
    ['plan_action_export', plan_id],
    async () => {
      return {
        plan: await fetchPlanAction(plan_id),
        annexes: await fetchAnnexesPlanAction(plan_id),
      };
    },
    // on ne charge les données que lors d'un appel explicite à `refetch`
    {enabled: false}
  );
};

// charge les données du plan d'action
const fetchPlanAction = async (plan_id: number) => {
  const {data} = await supabaseClient.rpc('plan_action_export', {
    id: plan_id,
  });
  return data as unknown as PlanAction;
};

// charge la liste des annexes associées aux fiches d'un plan d'action
const fetchAnnexesPlanAction = async (plan_id: number) => {
  const {data, error} = await supabaseClient
    .from('bibliotheque_annexe')
    .select()
    .overlaps('plan_ids', [plan_id])
    .order('lien->>titre' as 'lien', {ascending: true})
    .order('fichier->>filename' as 'fichier', {ascending: true});
  if (error) {
    throw new Error(error.message);
  }

  return data.map(a => ({
    ...a,
    preuve_type: 'annexe',
    fichier: a.fichier as TFichier | null,
    lien: a.lien as TPreuveLienFields['lien'] | null,
  }));
};
