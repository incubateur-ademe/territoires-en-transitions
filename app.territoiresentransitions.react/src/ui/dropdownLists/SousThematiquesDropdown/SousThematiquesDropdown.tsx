import { SousThematique } from '@/domain/shared';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect } from 'react';
import { useSousThematiqueListe } from './useSousThematiqueListe';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  thematiques: number[];
  sousThematiques: SousThematique[] | null | undefined;
  onChange: ({
    sousThematiques,
    selectedSousThematique,
  }: {
    sousThematiques: SousThematique[];
    selectedSousThematique: SousThematique;
  }) => void;
};

const SousThematiquesDropdown = ({
  thematiques,
  sousThematiques,
  onChange,
  ...props
}: Props) => {
  const sousThematiqueListe = useSousThematiqueListe();

  const options: Option[] = (sousThematiqueListe ?? [])
    .filter((st) => thematiques.some((t) => st.thematiqueId === t))
    .map((st) => ({
      value: st.id,
      label: st.nom,
    }));

  const getSelectedSousThematiques = (values?: OptionValue[]) =>
    (sousThematiqueListe ?? []).filter((st) =>
      values?.some((v) => v === st.id)
    );

  // Supprime les sous-thématiques quand une thématique est supprimée de la fiche
  useEffect(() => {
    if (sousThematiques) {
      // Récupère la liste des thématiques inclues dans les sous-thématiques
      const selectedThematiques: number[] = [];
      sousThematiques.forEach((st) => {
        if (
          !selectedThematiques.some(
            (selectedtThem) => selectedtThem === st.thematiqueId
          )
        ) {
          selectedThematiques.push(st.thematiqueId);
        }
      });

      // Si les listes sont différentes, on update la fiche
      if (
        selectedThematiques.some(
          (selectedtThem) => !thematiques.some((t) => t === selectedtThem)
        )
      ) {
        const newSousThematiques = sousThematiques.filter((st) =>
          thematiques.some((t) => t === st.thematiqueId)
        );

        onChange({
          sousThematiques: getSelectedSousThematiques(
            newSousThematiques?.map((st) => st.id)
          ),
          selectedSousThematique: getSelectedSousThematiques([
            newSousThematiques?.map((st) => st.id)[0],
          ])[0],
        });
      }
    }
  }, [thematiques.join()]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'sousThematiques'}
      values={sousThematiques?.map((st) => st.id)}
      options={options}
      onChange={({ values, selectedValue }) =>
        onChange({
          sousThematiques: getSelectedSousThematiques(values),
          selectedSousThematique: getSelectedSousThematiques([
            selectedValue,
          ])[0],
        })
      }
    />
  );
};

export default SousThematiquesDropdown;
