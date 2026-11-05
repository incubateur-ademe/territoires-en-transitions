import { canUpdateIndicateur } from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { useGetValeursUtilisables } from '../../score-indicatif/use-get-valeurs-utilisables';
import {
  filterLignesFromAnneeReference,
  getAnneeReference,
  getValeurReferenceManquante,
  ValeurReferenceManquante,
} from './filter-lignes-from-annee-reference.utils';
import { LigneValeur } from './group-lignes-by-annee.utils';
import {
  useSetIndicateurSuivi,
  useSetScoreFromIndicateur,
} from './use-set-score-from-indicateur';

type ValeurSelectionnee = NonNullable<
  ReturnType<typeof useGetValeursUtilisables>['data']
>['selection']['fait'];

type IndicateurModalResultats = {
  isLoading: boolean;
  isError: boolean;
  retry: () => void;

  /** Valeur retenue pour le score `fait` */
  valeurSelectionnee: ValeurSelectionnee | undefined;
  selectionneeId: number | null;
  /** Résultats listés, de l'année de référence à la plus récente */
  lignes: LigneValeur[];
  anneeReference: number | null;
  /** Des résultats existent mais sont écartés car antérieurs à l'année de référence */
  hasResultatsAnterieursMasques: boolean;
  valeurReferenceManquante: ValeurReferenceManquante | null;

  nonSuivi: boolean;
  canEditNonSuivi: boolean;
  /** Une sélection de résultat est en cours d'enregistrement */
  isSelecting: boolean;
  /** Le flag « non suivi » est en cours d'enregistrement */
  isUpdatingNonSuivi: boolean;
  /** Aucune sélection possible : indicateur non suivi ou calcul impossible */
  isListeDisabled: boolean;

  selectResultat: (indicateurValeurId: number | null) => void;
  toggleNonSuivi: () => void;
};

/**
 * Données et actions de l'onglet « Résultats » de la modale d'un indicateur
 * lié au score : résultats sélectionnables, valeur retenue, marquage « non
 * suivi » et valeur de l'année de référence manquante.
 */
export const useIndicateurModalResultats = ({
  actionId,
  indicateurId,
  calcul,
}: {
  actionId: string;
  indicateurId: number;
  calcul: CalculScoreIndicatif | null;
}): IndicateurModalResultats => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const user = useUser();

  const valeursQuery = useGetValeursUtilisables(actionId, indicateurId);
  const indicateurQuery = useGetIndicateur(indicateurId, collectiviteId);
  const valeursUtilisables = valeursQuery.data;
  const indicateur = indicateurQuery.data;

  const { mutate: setScoreFromIndicateur, isPending: isSelecting } =
    useSetScoreFromIndicateur();
  const { mutate: setIndicateurSuivi, isPending: isUpdatingNonSuivi } =
    useSetIndicateurSuivi();

  const nonSuivi = indicateur ? !indicateur.isSuivi : false;
  const canEditNonSuivi = indicateur
    ? canUpdateIndicateur(hasCollectivitePermission, indicateur, user.id)
    : false;

  const valeurSelectionnee = valeursUtilisables?.selection.fait;
  const selectionneeId = valeurSelectionnee?.id ?? null;

  const anneeReference = getAnneeReference(calcul);
  const valeurReferenceManquante = getValeurReferenceManquante(calcul);

  const toutesLignes: LigneValeur[] = (
    valeursUtilisables?.sources ?? []
  ).flatMap((source) =>
    source.fait.map((valeur) => ({
      ...valeur,
      source: source.libelle ?? appLabels.sourceCollectivite,
    }))
  );
  const lignes = filterLignesFromAnneeReference(
    toutesLignes,
    anneeReference,
    selectionneeId
  ).sort((a, b) => b.annee - a.annee);

  const selectResultat = (indicateurValeurId: number | null) => {
    setScoreFromIndicateur({
      actionId,
      collectiviteId,
      indicateurId,
      valeurs:
        indicateurValeurId === null
          ? []
          : [{ indicateurValeurId, typeScore: 'fait' }],
    });
  };

  // en cochant la case, le backend désélectionne aussi la valeur retenue et
  // recalcule le score de l'action
  const toggleNonSuivi = () => {
    setIndicateurSuivi({
      actionId,
      collectiviteId,
      indicateurId,
      isSuivi: nonSuivi,
    });
  };

  return {
    isLoading: valeursQuery.isLoading || indicateurQuery.isLoading,
    isError: !!valeursQuery.error || !!indicateurQuery.error,
    retry: () => {
      valeursQuery.refetch();
      indicateurQuery.refetch();
    },
    valeurSelectionnee,
    selectionneeId,
    lignes,
    anneeReference,
    hasResultatsAnterieursMasques: lignes.length < toutesLignes.length,
    valeurReferenceManquante,
    nonSuivi,
    canEditNonSuivi,
    isSelecting,
    isUpdatingNonSuivi,
    // sans valeur sur l'année de référence, aucun résultat ne permet de
    // calculer la progression : la liste est grisée
    isListeDisabled:
      nonSuivi || isUpdatingNonSuivi || valeurReferenceManquante !== null,
    selectResultat,
    toggleNonSuivi,
  };
};
