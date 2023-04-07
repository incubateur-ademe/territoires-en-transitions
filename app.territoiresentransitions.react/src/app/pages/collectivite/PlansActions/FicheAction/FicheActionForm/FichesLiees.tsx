import FormField from 'ui/shared/form/FormField';
import ActionCard from '../../components/ActionCard';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption} from 'ui/shared/select/commons';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFicheResumeListe} from '../data/useFicheResumeListe';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import FicheActionBadgeStatut from './FicheActionBadgeStatut';
import {FicheResume} from '../data/types';

type Props = {
  fiches: FicheResume[] | null;
  onSelect: (fiches: FicheResume[]) => void;
  isReadonly: boolean;
};

const FichesLiees = ({fiches, onSelect, isReadonly}: Props) => {
  const {data: ficheListe} = useFicheResumeListe();
  const collectiviteId = useCollectiviteId()!;

  const formatOptions = (fiches?: FicheResume[] | null): TOption[] => {
    const options = fiches
      ? fiches.map((fiche: FicheResume) => ({
          value: fiche.fiche_id!.toString(),
          label: fiche.fiche_nom ?? 'Sans titre',
        }))
      : [];

    return options;
  };

  const formatSelectedFiches = (values: string[]): FicheResume[] => {
    const selectedFiches =
      ficheListe
        ?.filter((fiche: FicheResume) =>
          values.some(v => v === fiche.fiche_id!.toString())
        )
        .map(
          (fiche: FicheResume): FicheResume => ({
            collectivite_id: fiche.collectivite_id,
            fiche_id: fiche.fiche_id,
            fiche_nom: fiche.fiche_nom,
            fiche_statut: fiche.fiche_statut,
            plans: fiche.plans,
          })
        ) ?? [];
    return selectedFiches;
  };

  return (
    <>
      <FormField label="Fiches liées">
        <AutocompleteInputSelect
          containerWidthMatchButton
          values={fiches?.map((fiche: FicheResume) =>
            fiche.fiche_id!.toString()
          )}
          options={formatOptions(ficheListe)}
          onSelect={values => onSelect(formatSelectedFiches(values))}
          placeholderText="Recherchez par mots-clés"
          disabled={isReadonly}
        />
      </FormField>
      {fiches && fiches.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {fiches.map(fiche => (
            <ActionCard
              key={fiche.fiche_id}
              link={
                fiche.plans && fiche.plans[0] && fiche.plans[0].id
                  ? makeCollectivitePlanActionFicheUrl({
                      collectiviteId,
                      ficheUid: fiche.fiche_id!.toString(),
                      planActionUid: fiche.plans[0].id!.toString(),
                    })
                  : makeCollectiviteFicheNonClasseeUrl({
                      collectiviteId,
                      ficheUid: fiche.fiche_id!.toString(),
                    })
              }
              statutBadge={
                fiche.fiche_statut && (
                  <FicheActionBadgeStatut statut={fiche.fiche_statut} small />
                )
              }
              details={fiche.plans && fiche.plans[0].nom}
              title={fiche.fiche_nom ?? 'Sans titre'}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default FichesLiees;
