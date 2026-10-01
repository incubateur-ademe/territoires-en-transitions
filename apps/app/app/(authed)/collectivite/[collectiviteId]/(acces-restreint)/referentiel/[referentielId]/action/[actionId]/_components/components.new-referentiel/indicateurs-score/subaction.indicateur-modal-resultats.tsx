import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { Checkbox, Divider } from '@tet/ui';
import { useGetValeursUtilisables } from '../../score-indicatif/use-get-valeurs-utilisables';
import {
  IndicateurResultatsTable,
  LigneValeur,
} from './subaction.indicateur-modal-resultats.table';
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
}: Props) => {
  const { actionId } = action;
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const user = useUser();

  const valeursQuery = useGetValeursUtilisables(actionId, indicateurId);
  const definitionQuery = useGetIndicateur(indicateurId, collectiviteId);
  const valeursUtilisables = valeursQuery.data;
  const definition = definitionQuery.data;

  const { mutate: setScoreFromIndicateur, isPending } =
    useSetScoreFromIndicateur();
  const { mutate: setIndicateurSuivi, isPending: isUpdatingNonSuivi } =
    useSetIndicateurSuivi();
  const nonSuivi = definition ? !definition.isSuivi : false;
  const canEditNonSuivi = definition
    ? canUpdateIndicateurDefinition(
        hasCollectivitePermission,
        definition,
        user.id
      )
    : false;

  const valeurSelectionnee = valeursUtilisables?.selection.fait;
  const selectionneeId = valeurSelectionnee?.id ?? null;

  const lignes: LigneValeur[] = (valeursUtilisables?.sources ?? [])
    .flatMap((source) =>
      source.fait.map((valeur) => ({
        ...valeur,
        source: source.libelle ?? appLabels.sourceCollectivite,
      }))
    )
    .sort((a, b) => b.annee - a.annee);

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

  if (valeursQuery.error || definitionQuery.error) {
    return (
      <ErrorCard
        title={appLabels.resultatsIndicateurErreur}
        retry={() => {
          valeursQuery.refetch();
          definitionQuery.refetch();
        }}
        retryLabel={appLabels.reessayer}
      />
    );
  }

  if (valeursQuery.isLoading || definitionQuery.isLoading) {
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
        selectionneeId={selectionneeId}
        isPending={isPending}
        disabled={nonSuivi || isUpdatingNonSuivi}
        onSelect={handleSelect}
      />
    </div>
  );
};
