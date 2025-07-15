import { useCollectiviteId } from '@/api/collectivites';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { naturalSort } from '@/app/utils/naturalSort';
import { CreateAxeType, FicheResume } from '@/domain/plans/fiches';
import {
  Option,
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
  SelectOption,
} from '@/ui';

const sortByLabel = (a: Option, b: Option) => {
  if (!a.label) return -1;
  if (!b.label) return 1;
  return naturalSort(a.label, b.label);
};

type FichesActionsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  ficheCouranteId: number | null;
  values?: string[];
  onChange: ({
    fiches,
    selectedFiche,
  }: {
    fiches: FicheResume[];
    selectedFiche: FicheResume;
  }) => void;
};

const FichesActionsDropdown = ({
  ficheCouranteId,
  ...props
}: FichesActionsDropdownProps) => {
  const collectiviteId = useCollectiviteId();
  // Liste de toutes les fiches
  const { data } = useListFicheResumes(collectiviteId);

  const fichesListe = data?.data;

  // Liste des fiches hors fiche actuellement consultée
  const fichesDisponiblesListe = fichesListe?.filter(
    (fiche) => fiche.id !== ficheCouranteId
  );

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedFiches = (values?: OptionValue[]) => {
    return (fichesDisponiblesListe ?? []).filter((fiche) =>
      values?.some((v) => v === fiche.id!.toString())
    );
  };

  // Calcul de la liste des options pour le select
  /* Récupère tous les plans liés aux fiches */

  const plans = fichesDisponiblesListe?.reduce<
    Array<Pick<CreateAxeType, 'id' | 'collectiviteId' | 'nom'>>
  >((acc, fiche) => {
    acc.push(
      fiche.plans?.[0] ?? {
        collectiviteId: fiche.collectiviteId!,
        id: -1,
        nom: 'Fiches non classées',
      }
    );
    return acc;
  }, []);

  /* Supprime tous les doublons parmi les plans et les trie par titre */
  const plansUniques = plans
    ?.filter(
      (plan, index, array) => array.findIndex((v) => v.id === plan.id) === index
    )
    .sort((a, b) => {
      if (!a.nom) return -1;
      return naturalSort(a.nom, b.nom || 'Fiches non classées');
    });

  /* Génère la liste d'options */
  const options: SelectOption[] = (plansUniques ?? []).map((plan) => {
    // id -1 : correspond aux fiches non classées
    if (plan.id === -1) {
      return {
        title: 'Fiches non classées',
        options: (fichesDisponiblesListe ?? [])
          .filter((fiche) => !fiche.plans || !fiche.plans[0])
          .map((fiche) => ({
            value: fiche.id!.toString(),
            label: generateTitle(fiche.titre),
          }))
          .sort(sortByLabel),
      };
      // fiches appartenant à un plan
    } else {
      return {
        title: generateTitle(plan.nom),
        options: (fichesDisponiblesListe ?? [])
          .filter(
            (fiche) =>
              fiche.plans && fiche.plans.some((p) => p && p.id === plan.id)
          )
          .map((fiche) => ({
            value: fiche.id!.toString(),
            label: generateTitle(fiche.titre),
          }))
          .sort(sortByLabel),
      };
    }
  });

  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={options}
      placeholder={props.placeholder ?? 'Recherchez par mots-clés'}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          fiches: getSelectedFiches(values) as FicheResume[],
          selectedFiche: getSelectedFiches([selectedValue])[0] as FicheResume,
        })
      }
    />
  );
};

export default FichesActionsDropdown;
