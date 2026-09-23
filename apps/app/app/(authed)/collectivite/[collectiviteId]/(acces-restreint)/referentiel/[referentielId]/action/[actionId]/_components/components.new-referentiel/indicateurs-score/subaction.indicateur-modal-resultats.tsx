import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
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
import { useSetScoreFromIndicateur } from './use-set-score-from-indicateur';

type Props = {
  action: ActionListItem;
  unite: string;
  indicateurId: number;
  calcul: CalculScoreIndicatif | null;
};

export const SubactionIndicateurModalResultats = ({
  action,
  unite,
  indicateurId,
  calcul,
}: Props) => {
  const { actionId } = action;
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const user = useUser();

  const { data: valeursUtilisables } = useGetValeursUtilisables(
    actionId,
    indicateurId
  );
  const { mutate: setScoreFromIndicateur, isPending } =
    useSetScoreFromIndicateur();

  const { data: definition } = useGetIndicateur(indicateurId, collectiviteId);
  const { mutate: updateIndicateur, isPending: isUpdatingNonSuivi } =
    useUpdateIndicateur(indicateurId);
  const nonSuivi = definition ? !definition.isApplicable : false;
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

  const handleToggleNonSuivi = () => {
    const nextNonSuivi = !nonSuivi;
    // en cochant la case, la valeur sélectionnée (s'il y en a une) est
    // désélectionnée comme lors d'une désélection manuelle, pour que le
    // score se recalcule sans elle
    const nextSelectionneeId = nextNonSuivi ? null : selectionneeId;

    // le score affiché (pointFait/pointPotentiel) vient d'un statut persisté
    // qui n'est recalculé que par setScoreFromIndicateur qu'il faut donc
    // appeler après la mise à jour du flag, même sans valeur sélectionnée,
    // afin que le score se mette à jour (neutralisation ou non de l'indicateur)
    updateIndicateur(
      { isApplicable: !nextNonSuivi },
      { onSuccess: () => handleSelect(nextSelectionneeId) }
    );
  };

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
        disabled={nonSuivi}
        onSelect={handleSelect}
      />
    </div>
  );
};
