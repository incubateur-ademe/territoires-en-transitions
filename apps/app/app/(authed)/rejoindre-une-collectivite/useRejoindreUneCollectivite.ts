import {
  Database,
  Enums,
  getCollectivitePath,
  useSupabase,
  useTRPC,
} from '@tet/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectivitePublic,
  type MembreFonction,
} from '@tet/domain/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const NB_COLLECTIVITES_FETCH = 20;
export type MatchingCollectivites = Pick<CollectivitePublic, 'id' | 'nom'>[];

export type RejoindreUneCollectiviteData = {
  collectiviteId?: number | null;
  role?: Enums<'membre_fonction'> | null;
  champ_intervention?: Array<Enums<'referentiel'>>;
  poste?: string;
  est_referent?: boolean;
};

export type RejoindreUneCollectiviteProps = {
  /** Erreur à afficher */
  error: string | null;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Liste de collectivités auxquelles le compte peut être rattaché */
  collectivites: MatchingCollectivites | null;
  /** Info sur la collectivité courante */
  collectiviteSelectionnee: CollectiviteInfo | null;
  /** Appelé pour filtrer la liste des collectivités */
  onFilterCollectivites: (search: string) => void;
  /** Appelé à l'envoi du formulaire */
  onSubmit: (data: RejoindreUneCollectiviteData) => void;
  /** Appelé lors du changement de sélection d'une collectivité dans la liste déroulante */
  onSelectCollectivite: (id: number | null) => void;
  /** Appelé à l'annulation du formulaire */
  onCancel: () => void;
};

type GetReferentContacts = Database['public']['Functions']['referent_contacts'];

type ReferentContact = GetReferentContacts['Returns'][0];

export type CollectiviteInfo = {
  id: number;
  nom: string;
  url: string;
  contacts?: ReferentContact[];
};

/**
 * Gère l'appel à la fonction de rattachement à une collectivité et la redirection après un rattachement réussi
 */
export const useRejoindreUneCollectivite = ({
  redirectTo,
}: {
  redirectTo: string;
}) => {
  const router = useRouter();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: joinCollectivite } = useMutation(
    trpc.collectivites.membres.join.mutationOptions()
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collectivites, setCollectivites] = useState<MatchingCollectivites>([]);
  const [collectiviteSelectionnee, setCollectiviteSelectionnee] =
    useState<CollectiviteInfo | null>(null);
  // Vrai dès que l'utilisateur a agi sur le sélecteur : empêche la
  // pré-sélection OIDC (qui arrive de façon asynchrone) d'écraser un choix déjà
  // fait.
  const userInteractedRef = useRef(false);

  const onCancel = () => router.back();

  const onSubmit = async (formData: RejoindreUneCollectiviteData) => {
    if (!formData?.collectiviteId || !formData.role) return;

    const poste = formData.poste?.trim();
    if (!poste) {
      setError('Veuillez renseigner votre intitulé de poste');
      return;
    }

    // réinitialise les erreurs
    setError(null);

    // demande le rattachement
    setIsLoading(true);
    try {
      await joinCollectivite({
        collectiviteId: formData.collectiviteId,
        champIntervention: formData.champ_intervention || [],
        fonction: formData.role as MembreFonction,
        detailsFonction: poste,
        estReferent: formData.est_referent || false,
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'Le rattachement à cette collectivité a échoué';
      setError(errorMessage);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);

    router.push(redirectTo);
  };

  const onFilterCollectivites = async (search: string) => {
    // charge les collectivites
    if (isLoading) return;
    setIsLoading(true);

    const matchingCollectivites = await queryClient.ensureQueryData(
      trpc.collectivites.collectivites.list.queryOptions({
        text: search,
        limit: NB_COLLECTIVITES_FETCH,
      })
    );

    setIsLoading(false);

    setCollectivites(matchingCollectivites);
  };

  const onSelectCollectivite = async (
    id: number | null,
    nomExplicite?: string
  ) => {
    userInteractedRef.current = true;
    if (id) {
      const { data: contacts, error } = await supabase.rpc(
        'referent_contacts',
        {
          id,
        }
      );

      // `nomExplicite` : cas de la pré-sélection OIDC, où la collectivité peut
      // ne pas (encore) figurer dans la liste chargée par la recherche.
      const nom = nomExplicite ?? collectivites?.find((c) => c.id === id)?.nom;
      if (!error && nom) {
        setCollectiviteSelectionnee({
          id,
          nom,
          url: getCollectivitePath(id),
          contacts,
        });
      }
    } else {
      setCollectiviteSelectionnee(null);
    }
  };

  // Pré-sélection à la première inscription OIDC : le backend rapproche
  // le SIRET ProConnect d'une collectivité ; si correspondance unique, on la
  // propose d'emblée (l'utilisateur reste libre d'en changer). `null` →
  // sélecteur vide, comportement habituel.
  const { data: preselection } = useQuery(
    trpc.users.authentications.oidc.getPreselectedCollectivite.queryOptions()
  );
  const preselectionAppliquee = useRef(false);
  useEffect(() => {
    // Ne pas écraser un choix déjà fait : si l'utilisateur a interagi avec le
    // sélecteur avant que la pré-sélection n'arrive, on la laisse tomber.
    if (
      !preselection ||
      preselectionAppliquee.current ||
      userInteractedRef.current
    ) {
      return;
    }
    preselectionAppliquee.current = true;
    setCollectivites((prev) =>
      prev.some((c) => c.id === preselection.collectiviteId)
        ? prev
        : [...prev, { id: preselection.collectiviteId, nom: preselection.nom }]
    );
    onSelectCollectivite(preselection.collectiviteId, preselection.nom);
    // Appliquée une seule fois, au premier retour de la query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselection]);

  const selectionIsNotIntoFetchedData =
    collectiviteSelectionnee?.id &&
    collectivites &&
    !collectivites?.find((c) => c.id === collectiviteSelectionnee?.id);

  return {
    // on s'assure que la collectivité sélectionnée est bien présente dans les
    // items pour éviter une erreur dans le composant Select
    collectivites: selectionIsNotIntoFetchedData
      ? [
          ...(collectivites || []),
          {
            id: collectiviteSelectionnee.id,
            nom: collectiviteSelectionnee.nom,
          },
        ]
      : collectivites,
    collectiviteSelectionnee,
    error,
    setError,
    isLoading,
    setIsLoading,
    onFilterCollectivites,
    onSelectCollectivite,
    onCancel,
    onSubmit,
  };
};
