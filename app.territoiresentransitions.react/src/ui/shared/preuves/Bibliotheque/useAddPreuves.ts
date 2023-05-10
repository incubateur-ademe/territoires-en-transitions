import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

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
export const useAddPreuveReglementaire = () =>
  useMutation(
    async (preuve: TAddPreuveReglementaireArgs) =>
      supabaseClient.from('preuve_reglementaire').insert(preuve),
    {
      mutationKey: 'add_preuve_reglementaire',
      onSuccess: useRefetchPreuves(),
    }
  );

/** Ajoute une preuve complémentaire à une action */
type TAddPreuveComplementaireArgs = {
  collectivite_id: number;
  action_id: string;
} & TFileOrLink;
export const useAddPreuveComplementaire = () =>
  useMutation(
    async (preuve: TAddPreuveComplementaireArgs) =>
      supabaseClient.from('preuve_complementaire').insert(preuve),
    {
      mutationKey: 'add_preuve_complementaire',
      onSuccess: useRefetchPreuves(),
    }
  );

/** Ajoute une preuve à une demande de labellisation */
type TAddPreuveLabellisationArgs = {
  collectivite_id: number;
  demande_id: number;
} & TFileOrLink;
export const useAddPreuveLabellisation = () => {
  return useMutation(
    async (preuve: TAddPreuveLabellisationArgs) =>
      supabaseClient.from('preuve_labellisation').insert(preuve),
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
export const useAddPreuveAudit = () =>
  useMutation(
    async (preuve: TAddPreuveAuditArgs) =>
      supabaseClient.from('preuve_audit').insert(preuve),
    {
      mutationKey: 'add_preuve_audit',
      onSuccess: useRefetchPreuves(true),
    }
  );

/** Ajoute un rapport de visite annuelle */
type TAddPreuveRapportArgs = {
  collectivite_id: number;
  date: string;
} & TFileOrLink;
export const useAddPreuveRapport = () =>
  useMutation(
    async (preuve: TAddPreuveRapportArgs) =>
      supabaseClient.from('preuve_rapport').insert(preuve),
    {
      mutationKey: 'add_preuve_rapport',
      onSuccess: useRefetchPreuves(),
    }
  );

/** Ajoute une annexe à une fiche action */
type TAddPreuveAnnexeArgs = {
  collectivite_id: number;
  fiche_id: number;
} & TFileOrLink;
export const useAddPreuveAnnexe = () =>
  useMutation(
    async (preuve: TAddPreuveAnnexeArgs) =>
      supabaseClient.from('annexe').insert(preuve),
    {
      mutationKey: 'add_annexe',
      onSuccess: useRefetchPreuves(),
    }
  );

// recharge la liste des preuves
export const useRefetchPreuves = (invalidateParcours: boolean = false) => {
  const queryClient = useQueryClient();
  return (data: unknown, variables: {collectivite_id: number}) => {
    const {collectivite_id} = variables;
    queryClient.invalidateQueries(['preuve', collectivite_id]);
    queryClient.invalidateQueries(['annexes_fiche_action']);
    queryClient.invalidateQueries(['preuve_count', collectivite_id]);
    if (invalidateParcours) {
      queryClient.invalidateQueries([
        'labellisation_parcours',
        collectivite_id,
      ]);
    }
  };
};
