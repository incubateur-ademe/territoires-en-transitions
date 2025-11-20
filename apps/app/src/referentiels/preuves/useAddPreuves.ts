import {
  QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useSupabase } from '@tet/api';

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TAddPreuveReglementaireArgs) =>
      supabase.from('preuve_reglementaire').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

/** Ajoute une preuve complémentaire à une action */
type TAddPreuveComplementaireArgs = {
  collectivite_id: number;
  action_id: string;
} & TFileOrLink;
export const useAddPreuveComplementaire = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TAddPreuveComplementaireArgs) =>
      supabase.from('preuve_complementaire').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

/** Ajoute une preuve à une demande de labellisation */
type TAddPreuveLabellisationArgs = {
  collectivite_id: number;
  demande_id: number;
} & TFileOrLink;
export const useAddPreuveLabellisation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TAddPreuveLabellisationArgs) =>
      supabase.from('preuve_labellisation').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: true,
      });
    },
  });
};

/** Ajoute un rapport d'audit */
type TAddPreuveAuditArgs = {
  collectivite_id: number;
  audit_id: number;
} & TFileOrLink;
export const useAddPreuveAudit = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TAddPreuveAuditArgs) =>
      supabase.from('preuve_audit').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: true,
      });
    },
  });
};

/** Ajoute un rapport de visite annuelle */
type TAddPreuveRapportArgs = {
  collectivite_id: number;
  date: string;
} & TFileOrLink;
export const useAddPreuveRapport = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TAddPreuveRapportArgs) =>
      supabase.from('preuve_rapport').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

/** Ajoute une annexe à une fiche action */
type TAddPreuveAnnexeArgs = {
  collectivite_id: number;
  fiche_id: number;
} & TFileOrLink;
export const useAddPreuveAnnexe = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  return useMutation({
    mutationKey: ['upsert_preuve_annexe'],
    mutationFn: async (preuve: TAddPreuveAnnexeArgs) =>
      supabase.from('annexe').insert(preuve),

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

// recharge la liste des preuves
export const invalidateQueries = (
  queryClient: QueryClient,
  collectiviteId: number,
  { invalidateParcours }: { invalidateParcours: boolean }
) => {
  queryClient.invalidateQueries({
    queryKey: ['preuve', collectiviteId],
  });
  queryClient.invalidateQueries({
    queryKey: ['annexes_fiche_action'],
  });
  queryClient.invalidateQueries({
    queryKey: ['fiche_action'],
  });
  queryClient.invalidateQueries({
    queryKey: ['preuve_count', collectiviteId],
  });
  if (invalidateParcours) {
    queryClient.invalidateQueries({
      queryKey: ['labellisation_parcours', collectiviteId],
    });
  }
};
