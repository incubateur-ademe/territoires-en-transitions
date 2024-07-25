import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption, TOptionSection} from 'ui/shared/select/commons';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import {FicheResume} from '../data/types';
import {TAxeInsert} from 'types/alias';
import {generateTitle} from '../data/utils';
import FicheActionCard from '../Carte/FicheActionCard';
import {naturalSort} from 'utils/naturalSort';
import {Field} from '@tet/ui';
import {useFicheResumesFetch} from '../data/useFicheResumesFetch';

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
  const {data} = useFicheResumesFetch();
  const ficheListe = data?.data || [];

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
    const uniquePlans = plans
      ?.filter((plan, i, a) => a.findIndex(v => v.id === plan.id) === i)
      // et tri pas titre de plan
      .sort((a, b) => {
        if (!a.nom) return -1;
        return naturalSort(a.nom, b.nom || 'Fiches non classées');
      });

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
                    label: generateTitle(fiche.titre),
                  }))
                  .sort(byLabel) ?? [],
            };
          } else {
            return {
              title: generateTitle(plan.nom),
              options:
                fiches
                  ?.filter(
                    fiche =>
                      fiche.plans &&
                      fiche.plans.some(p => p && p.id === plan.id)
                  )
                  .map(fiche => ({
                    value: fiche.id!.toString(),
                    label: generateTitle(fiche.titre),
                  }))
                  .sort(byLabel) ?? [],
            };
          }
        })
      : [];

    return options;
  };

  const byLabel = (a: TOption, b: TOption) => {
    if (!a.label) return -1;
    if (!b.label) return 1;
    return naturalSort(a.label, b.label);
  };

  const formatSelectedFiches = (values: string[]) => {
    const selectedFiches =
      ficheListeSansFicheCourante?.filter((fiche: FicheResume) =>
        values.some(v => v === fiche.id!.toString())
      ) ?? [];
    return selectedFiches;
  };

  return (
    <>
      <Field title="Fiches des plans liées">
        <AutocompleteInputSelect
          dsfrButton
          containerWidthMatchButton
          values={fiches?.map((fiche: FicheResume) => fiche.id!.toString())}
          options={formatOptions(ficheListeSansFicheCourante)}
          onSelect={values => onSelect(formatSelectedFiches(values))}
          placeholderText="Recherchez par mots-clés"
          disabled={isReadonly}
        />
      </Field>
      {fiches && fiches.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {fiches.map(fiche => (
            <div className="relative self-stretch" key={fiche.id}>
              <FicheActionCard
                openInNewTab
                ficheAction={fiche}
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
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FichesLiees;
