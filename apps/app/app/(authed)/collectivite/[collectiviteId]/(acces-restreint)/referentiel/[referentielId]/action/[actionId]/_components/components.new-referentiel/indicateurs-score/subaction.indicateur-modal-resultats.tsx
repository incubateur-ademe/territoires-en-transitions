import { canUpdateIndicateur } from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { Alert, Checkbox, Divider, InlineLink } from '@tet/ui';
import { useGetValeursUtilisables } from '../../score-indicatif/use-get-valeurs-utilisables';
import {
  filterLignesFromAnneeReference,
  getAnneeReference,
  getValeurReferenceManquante,
} from './filter-lignes-from-annee-reference.utils';
import { LigneValeur } from './group-lignes-by-annee.utils';
import { IndicateurResultatsTable } from './subaction.indicateur-modal-resultats.table';
import { SubactionIndicateurScore } from './subaction.indicateur-score';
import { useIsScoreIndicateurEnabled } from './use-is-score-indicateur-enabled';
import {
  useSetIndicateurSuivi,
  useSetScoreFromIndicateur,
} from './use-set-score-from-indicateur';

type Props = {
  action: ActionListItem;
  unite: string;
  indicateurId: number;
  calcul: CalculScoreIndicatif | null;
  /** Page de l'indicateur, où saisir la valeur de l'année de référence */
  indicateurUrl: string;
};

export const SubactionIndicateurModalResultats = (props: Props) => {
  const isScoreIndicateurEnabled = useIsScoreIndicateurEnabled();

  if (!isScoreIndicateurEnabled) {
    return (
      <div className="text-sm py-4">
        {appLabels.selectionValeurIndicateurNotAvailable}
      </div>
    );
  }

  return <SubactionIndicateurModalResultatsContent {...props} />;
};

const SubactionIndicateurModalResultatsContent = ({
  action,
  unite,
  indicateurId,
  calcul,
  indicateurUrl,
}: Props) => {
  const { actionId } = action;
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const user = useUser();

  const valeursQuery = useGetValeursUtilisables(actionId, indicateurId);
  const indicateurQuery = useGetIndicateur(indicateurId, collectiviteId);
  const valeursUtilisables = valeursQuery.data;
  const indicateur = indicateurQuery.data;

  const { mutate: setScoreFromIndicateur, isPending } =
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
  // sans valeur sur l'année de référence, aucun résultat ne permet de
  // calculer la progression : la liste est grisée
  const isCalculImpossible = valeurReferenceManquante !== null;
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

  const handleSelect = (indicateurValeurId: number | null) => {
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
  const handleToggleNonSuivi = () => {
    setIndicateurSuivi({
      actionId,
      collectiviteId,
      indicateurId,
      isSuivi: nonSuivi,
    });
  };

  if (valeursQuery.error || indicateurQuery.error) {
    return (
      <ErrorCard
        title={appLabels.resultatsIndicateurErreur}
        retry={() => {
          valeursQuery.refetch();
          indicateurQuery.refetch();
        }}
        retryLabel={appLabels.reessayer}
      />
    );
  }

  if (valeursQuery.isLoading || indicateurQuery.isLoading) {
    return (
      <div className="flex py-8">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  return (
    <div>
      <SubactionIndicateurScore
        action={action}
        unite={unite}
        calcul={calcul}
        valeurSelectionnee={valeurSelectionnee}
        size="md"
      />
      <Divider className="my-4" />
      {valeurReferenceManquante && (
        <Alert
          className="mb-4"
          state="info"
          description={
            valeurReferenceManquante.type === 'reduction' ? (
              <p className="mb-0 text-sm text-grey-9">
                {appLabels.scoreIndicatifValeurReferenceManquante(
                  valeurReferenceManquante.annee
                )}{' '}
                <InlineLink
                  href={indicateurUrl}
                  openInNewTab
                  data-test="referentiels.score-indicatif.valeur-reference-manquante-lien"
                >
                  {appLabels.scoreIndicatifValeurReferenceManquanteLien}
                </InlineLink>
              </p>
            ) : (
              appLabels.scoreIndicatifTrajectoireSnbcManquante(
                valeurReferenceManquante.annee
              )
            )
          }
        />
      )}
      <Checkbox
        containerClassname="mb-4"
        label={appLabels.indicateurNonSuiviCheckboxLabel}
        checked={nonSuivi}
        disabled={!canEditNonSuivi || isUpdatingNonSuivi || isPending}
        onChange={handleToggleNonSuivi}
      />
      <IndicateurResultatsTable
        lignes={lignes}
        unite={unite}
        anneeReference={anneeReference}
        hasResultatsAnterieursMasques={lignes.length < toutesLignes.length}
        selectionneeId={selectionneeId}
        isPending={isPending}
        disabled={nonSuivi || isUpdatingNonSuivi || isCalculImpossible}
        onSelect={handleSelect}
      />
    </div>
  );
};
