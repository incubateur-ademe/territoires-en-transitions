import FormField from 'ui/shared/form/FormField';
import ActionCard from '../../components/ActionCard';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOptionSection} from 'ui/shared/select/commons';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFicheResumeListe} from '../data/useFicheResumeListe';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import FicheActionBadgeStatut from './FicheActionBadgeStatut';
import {FicheResume} from '../data/types';
import {TAxeInsert} from 'types/alias';

type Props = {
  ficheCouranteId: number | null;
  fiches: FicheResume[] | null;
  onSelect: (fiches: FicheResume[]) => void;
  isReadonly: boolean;
};

const FichesLiees = ({
  ficheCouranteId,
  fiches,
  onSelect,
  isReadonly,
}: Props) => {
  const {data: ficheListe} = useFicheResumeListe();
  const collectiviteId = useCollectiviteId()!;

  const ficheListeSansFicheCourante = ficheListe?.filter(
    fiche => fiche.id !== ficheCouranteId
  );

  const formatOptions = (fiches?: FicheResume[] | null): any[] => {
    /** Récupère tous les plans liés aux fiches */
    const plans = fiches?.reduce((acc: TAxeInsert[], fiche: FicheResume) => {
      if (fiche.plans && fiche.plans[0] && fiche.plans[0] !== null) {
        acc.push(fiche.plans[0]);
      } else {
        acc.push({
          collectivite_id: fiche.collectivite_id!,
          id: -1,
          nom: 'Fiches non classées',
        });
      }
      return acc;
    }, []);

    /** Supprime tous les doublons */
    const uniquePlans = plans?.filter(
      (plan, i, a) => a.findIndex(v => v.id === plan.id) === i
    );

    /** Génère les sections par plan avec fiches en options */
    const options: TOptionSection[] = uniquePlans
      ? uniquePlans.map(plan => {
          // id -1 correspond aux fiches non classées
          if (plan.id === -1) {
            return {
              title: 'Fiches non classées',
              options:
                fiches
                  ?.filter(fiche => !fiche.plans || !fiche.plans[0])
                  .map(fiche => ({
                    value: fiche.id!.toString(),
                    label: fiche.titre ?? 'Sans titre',
                  })) ?? [],
            };
          } else {
            return {
              title: plan.nom ?? 'Sans titre',
              options:
                fiches
                  ?.filter(
                    fiche =>
                      fiche.plans &&
                      fiche.plans.some(p => p && p.id === plan.id)
                  )
                  .map(fiche => ({
                    value: fiche.id!.toString(),
                    label: fiche.titre ?? 'Sans titre',
                  })) ?? [],
            };
          }
        })
      : [];

    return options;
  };

  const formatSelectedFiches = (values: string[]) => {
    const selectedFiches =
      ficheListeSansFicheCourante?.filter((fiche: FicheResume) =>
        values.some(v => v === fiche.id!.toString())
      ) ?? [];
    return selectedFiches;
  };

  const generateCardDetails = (plans: TAxeInsert[] | [null] | null) => {
    if (plans && plans[0]) {
      if (plans[0].nom) {
        return plans[0].nom;
      } else {
        return 'Sans titre';
      }
    } else {
      return 'Fiches non classées';
    }
  };

  return (
    <>
      <FormField label="Fiches des plans liées">
        <AutocompleteInputSelect
          containerWidthMatchButton
          values={fiches?.map((fiche: FicheResume) => fiche.id!.toString())}
          options={formatOptions(ficheListeSansFicheCourante)}
          onSelect={values => onSelect(formatSelectedFiches(values))}
          placeholderText="Recherchez par mots-clés"
          disabled={isReadonly}
        />
      </FormField>
      {fiches && fiches.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {fiches.map(fiche => (
            <ActionCard
              key={fiche.id}
              link={
                fiche.plans && fiche.plans[0] && fiche.plans[0].id
                  ? makeCollectivitePlanActionFicheUrl({
                      collectiviteId,
                      ficheUid: fiche.id!.toString(),
                      planActionUid: fiche.plans[0].id!.toString(),
                    })
                  : makeCollectiviteFicheNonClasseeUrl({
                      collectiviteId,
                      ficheUid: fiche.id!.toString(),
                    })
              }
              statutBadge={
                fiche.statut && (
                  <FicheActionBadgeStatut statut={fiche.statut} small />
                )
              }
              details={generateCardDetails(fiche.plans)}
              title={fiche.titre ?? 'Sans titre'}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default FichesLiees;
