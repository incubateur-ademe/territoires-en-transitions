import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { Alert, Checkbox, Divider, InlineLink } from '@tet/ui';
import { IndicateurResultatsTable } from './subaction.indicateur-modal-resultats.table';
import { SubactionIndicateurScore } from './subaction.indicateur-score';
import { useIndicateurModalResultats } from './use-indicateur-modal-resultats';
import { useIsScoreIndicateurEnabled } from './use-is-score-indicateur-enabled';

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
  const {
    isLoading,
    isError,
    retry,
    valeurSelectionnee,
    selectionneeId,
    lignes,
    anneeReference,
    hasResultatsAnterieursMasques,
    valeurReferenceManquante,
    nonSuivi,
    canEditNonSuivi,
    isSelecting,
    isUpdatingNonSuivi,
    isListeDisabled,
    selectResultat,
    toggleNonSuivi,
  } = useIndicateurModalResultats({
    actionId: action.actionId,
    indicateurId,
    calcul,
  });

  if (isError) {
    return (
      <ErrorCard
        title={appLabels.resultatsIndicateurErreur}
        retry={retry}
        retryLabel={appLabels.reessayer}
      />
    );
  }

  if (isLoading) {
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
        disabled={!canEditNonSuivi || isUpdatingNonSuivi || isSelecting}
        onChange={toggleNonSuivi}
      />
      <IndicateurResultatsTable
        lignes={lignes}
        unite={unite}
        anneeReference={anneeReference}
        hasResultatsAnterieursMasques={hasResultatsAnterieursMasques}
        selectionneeId={selectionneeId}
        isPending={isSelecting}
        disabled={isListeDisabled}
        onSelect={selectResultat}
      />
    </div>
  );
};
