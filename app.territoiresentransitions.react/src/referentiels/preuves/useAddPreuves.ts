import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from 'react-query';

// on peut ajouter une preuve sous forme de...
type TFileOrLink =
  // ...référence à un fichier de la bibliothèque
  | {
      fichier_id: number;
      commentaire: string;
    }
  // ..ou de lien
  | {
      url: string;
      titre: string;
      commentaire: string;
    };

/** Ajoute une preuve réglementaire à une action */
type TAddPreuveReglementaireArgs = {
  collectivite_id: number;
  preuve_id: string;
} & TFileOrLink;
export const useAddPreuveReglementaire = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveReglementaireArgs) =>
      supabase.from('preuve_reglementaire').insert(preuve),
    {
      mutationKey: 'add_preuve_reglementaire',
      onSuccess: useRefetchPreuves(),
    }
  );
};

/** Ajoute une preuve complémentaire à une action */
type TAddPreuveComplementaireArgs = {
  collectivite_id: number;
  action_id: string;
} & TFileOrLink;
export const useAddPreuveComplementaire = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveComplementaireArgs) =>
      supabase.from('preuve_complementaire').insert(preuve),
    {
      mutationKey: 'add_preuve_complementaire',
      onSuccess: useRefetchPreuves(),
    }
  );
};

/** Ajoute une preuve à une demande de labellisation */
type TAddPreuveLabellisationArgs = {
  collectivite_id: number;
  demande_id: number;
} & TFileOrLink;
export const useAddPreuveLabellisation = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveLabellisationArgs) =>
      supabase.from('preuve_labellisation').insert(preuve),
    {
      mutationKey: 'add_preuve_labellisation',
      onSuccess: useRefetchPreuves(true),
    }
  );
};

/** Ajoute un rapport d'audit */
type TAddPreuveAuditArgs = {
  collectivite_id: number;
  audit_id: number;
} & TFileOrLink;
export const useAddPreuveAudit = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveAuditArgs) =>
      supabase.from('preuve_audit').insert(preuve),
    {
      mutationKey: 'add_preuve_audit',
      onSuccess: useRefetchPreuves(true),
    }
  );
};

/** Ajoute un rapport de visite annuelle */
type TAddPreuveRapportArgs = {
  collectivite_id: number;
  date: string;
} & TFileOrLink;
export const useAddPreuveRapport = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveRapportArgs) =>
      supabase.from('preuve_rapport').insert(preuve),
    {
      mutationKey: 'add_preuve_rapport',
      onSuccess: useRefetchPreuves(),
    }
  );
};

/** Ajoute une annexe à une fiche action */
type TAddPreuveAnnexeArgs = {
  collectivite_id: number;
  fiche_id: number;
} & TFileOrLink;
export const useAddPreuveAnnexe = () => {
  const supabase = useSupabase();
  return useMutation(
    async (preuve: TAddPreuveAnnexeArgs) =>
      supabase.from('annexe').insert(preuve),
    {
      mutationKey: 'add_annexe',
      onSuccess: useRefetchPreuves(),
    }
  );
};

// recharge la liste des preuves
export const useRefetchPreuves = (invalidateParcours = false) => {
  const queryClient = useQueryClient();
  return (data: unknown, variables: { collectivite_id: number }) => {
    const { collectivite_id } = variables;
    queryClient.invalidateQueries(['preuve', collectivite_id]);
    queryClient.invalidateQueries(['annexes_fiche_action']);
    queryClient.invalidateQueries(['fiche_action']);
    queryClient.invalidateQueries(['preuve_count', collectivite_id]);
    if (invalidateParcours) {
      queryClient.invalidateQueries([
        'labellisation_parcours',
        collectivite_id,
      ]);
    }
  };
};
