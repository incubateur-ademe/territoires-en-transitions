import { DBClient } from '@/api';
import { useCollectiviteId, useCurrentCollectivite } from '@/api/collectivites/collectivite-context';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { usePreuvesParType } from '@/app/referentiels/preuves/usePreuves';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';
import { useReferentielId } from '../referentiel-context';
import { TAudit } from './types';

// charge les données
const fetch = async (
  supabase: DBClient,
  collectivite_id: number,
  referentiel: ReferentielId
) => {
  // lit le statut de l'audit en cours (s'il existe)
  const { data, error } = await supabase
    .from('audit_en_cours')
    .select('*')
    .match({ collectivite_id, referentiel })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0] as TAudit;
};

/**
 * Statut d'audit du référentiel et de la collectivité courante.
 */
export const useAudit = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['audit', collectivite_id, referentiel],

    queryFn: () =>
      collectivite_id && referentiel
        ? fetch(supabase, collectivite_id, referentiel)
        : null,
  });
};

/** Indique si l'utilisateur courant est l'auditeur pour la
 * collectivité courante */
export const useIsAuditeur = () => {
  const collectivite = useCurrentCollectivite();
  return collectivite?.isRoleAuditeur || false;
};

/** Liste des auditeurs pour la collectivité et le référentiel courant */
export const useAuditeurs = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['auditeurs', collectivite_id, referentiel],

    queryFn: () =>
      collectivite_id
        ? fetchAuditeurs(supabase, collectivite_id, referentiel)
        : null,
  });
};

/** Liste des auditeurs d'un audit donné */
export const useAuditAuditeurs = (audit_id?: number) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['audit_auditeurs', audit_id],

    queryFn: async () => {
      if (!audit_id) {
        return [];
      }
      const { data } = await supabase
        .from('audit_auditeur')
        .select('auditeur')
        .eq('audit_id', audit_id);
      return data || [];
    },
  });
};

/** Indique si l'utilisateur courant est l'auditeur d'un audit donné */
export const useIsAuditAuditeur = (audit_id?: number) => {
  const user = useUser();
  const { data: auditeurs } = useAuditAuditeurs(audit_id);
  if (!user || !auditeurs?.length) {
    return false;
  }
  return auditeurs.findIndex(({ auditeur }) => auditeur === user.id) !== -1;
};

export type TAuditeur = { nom: string; prenom: string };
const fetchAuditeurs = async (
  supabase: DBClient,
  collectivite_id: number,
  referentiel: ReferentielId
) => {
  const { data, error } = await supabase
    .from('auditeurs')
    .select('noms')
    .match({ collectivite_id, referentiel })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0].noms as TAuditeur[];
};

/** Rapport(s) associé(s) à un audit */
export const useRapportsAudit = (audit_id?: number) => {
  const { audit } = usePreuvesParType({ preuve_types: ['audit'], audit_id });
  return audit || [];
};

/** Détermine si un COT est actif pour la collectivité */
export const useHasActiveCOT = () => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['is_cot', collectivite_id],

    queryFn: async () => {
      const { count } = await supabase
        .from('cot')
        .select(undefined, { head: true, count: 'exact' })
        .match({ collectivite_id, actif: true });
      return Boolean(count);
    },
  });
  return data || false;
};

/** Détermine si la description de l'action doit être affichée dans la page
 * Action ou dans le panneau d'information */
export const useShowDescIntoInfoPanel = () => {
  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  // la description de l'action est affichée dans le panneau uniquement pour
  // l'auditeur et pour un audit en cours
  return (audit && audit.date_debut && !audit.valide && isAuditeur) || false;
};
