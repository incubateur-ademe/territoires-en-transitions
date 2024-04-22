import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from 'src/clientAPI';
import {
  CollectiviteInfo,
  CollectiviteNom,
  RejoindreUneCollectiviteData,
} from '@components/RejoindreUneCollectivite';
import {
  getCollectivitePath,
  makeSearchString,
  restoreSessionFromAuthTokens,
} from '@tet/api';

export const NB_COLLECTIVITES_FETCH = 10;

/**
 * Gère l'appel à la fonction de rattachement à une collectivité et la redirection après un rattachement réussi
 */
export const useRejoindreUneCollectivite = ({
  redirectTo,
}: {
  redirectTo: string;
}) => {
  const router = useRouter();
  restoreSessionFromAuthTokens(supabase);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collectivites, setCollectivites] = useState<Array<CollectiviteNom>>(
    [],
  );
  const [collectiviteSelectionnee, setCollectiviteSelectionnee] =
    useState<CollectiviteInfo | null>(null);

  const onCancel = () => router.back();

  const onSubmit = async (formData: RejoindreUneCollectiviteData) => {
    if (!formData?.collectiviteId || !formData.role) return;

    // réinitialise les erreurs
    setError(null);

    // demande le rattachement
    setIsLoading(true);
    const {error} = await supabase.rpc('claim_collectivite', {
      collectivite_id: formData.collectiviteId,
      champ_intervention: formData.champ_intervention || [],
      role: formData.role,
      poste: formData.poste || '',
      est_referent: formData.est_referent || false,
    });
    setIsLoading(false);

    // sort si il y a une erreur
    if (error) {
      setError('Le rattachement à cette collectivité a échoué');
      return;
    }

    // redirige
    router.push(redirectTo);
  };

  const onFilterCollectivites = async (search: string) => {
    // charge les collectivites
    if (isLoading) return;
    setIsLoading(true);
    const query = supabase
      .from('named_collectivite')
      .select('*,collectivite_test(id)')
      .limit(NB_COLLECTIVITES_FETCH);

    const processedSearch = makeSearchString(search, 'nom');
    if (processedSearch) {
      query.or(processedSearch);
    }

    const {error, data} = await query;
    setIsLoading(false);
    if (!error && data) {
      setCollectivites(
        data.filter(c => !c.collectivite_test?.length) as CollectiviteNom[],
      );
    }
  };

  const onSelectCollectivite = async (id: number | null) => {
    if (id) {
      const {data: contacts, error} = await supabase.rpc('referent_contacts', {
        id,
      });

      const nom = collectivites?.find(c => c.collectivite_id === id)?.nom;
      if (!error && nom) {
        setCollectiviteSelectionnee({
          id,
          nom,
          url: getCollectivitePath(document.location.hostname, id),
          contacts,
        });
      }
    } else {
      setCollectiviteSelectionnee(null);
    }
  };

  const selectionIsNotIntoFetchedData =
    collectiviteSelectionnee?.id &&
    collectivites &&
    !collectivites?.find(
      c => c.collectivite_id === collectiviteSelectionnee?.id,
    );

  return {
    // on s'assure que la collectivité sélectionnée est bien présente dans les
    // items pour éviter une erreur dans le composant Select
    collectivites: selectionIsNotIntoFetchedData
      ? [
          ...(collectivites || []),
          {
            collectivite_id: collectiviteSelectionnee.id,
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
