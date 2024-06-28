import {useEffect} from 'react';
import {TSousThematiqueRow} from 'types/alias';
import {useSousThematiqueListe} from './useSousThematiqueListe';
import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  thematiques: number[];
  sousThematiques: TSousThematiqueRow[] | null;
  onChange: ({
    sousThematiques,
    selectedSousThematique,
  }: {
    sousThematiques: TSousThematiqueRow[];
    selectedSousThematique: TSousThematiqueRow;
  }) => void;
};

const SousThematiquesDropdown = ({
  thematiques,
  sousThematiques,
  onChange,
  ...props
}: Props) => {
  const {data: sousThematiqueListe} = useSousThematiqueListe();

  const options: Option[] = (sousThematiqueListe ?? [])
    .filter(st => thematiques.some(t => st.thematique_id === t))
    .map(st => ({
      value: st.id,
      label: st.sous_thematique,
    }));

  const getSelectedSousThematiques = (values?: OptionValue[]) =>
    sousThematiqueListe?.filter(st => values?.some(v => v === st.id)) ?? [];

  // Supprime les sous-thématiques quand une thématique est supprimée de la fiche
  useEffect(() => {
    if (sousThematiques) {
      // Récupère la liste des thématiques incluses dans les sous-thématiques
      const selectedThematiques: number[] = [];
      sousThematiques.forEach(st => {
        if (!selectedThematiques.some(stt => stt === st.thematique_id)) {
          selectedThematiques.push(st.id);
        }
      });

      // Si les listes sont différentes, on update la fiche
      if (selectedThematiques.some(stt => !thematiques.some(t => t === stt))) {
        const newSousThematiques = sousThematiques.filter(st =>
          thematiques.some(stt => stt === st.thematique_id)
        );
        onChange({
          sousThematiques: getSelectedSousThematiques(
            newSousThematiques?.map(st => st.id)
          ),
          selectedSousThematique: getSelectedSousThematiques([
            newSousThematiques?.map(st => st.id)[0],
          ])[0],
        });
      }
    }
  }, [thematiques.join()]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'sousThematiques'}
      values={sousThematiques?.map(st => st.id)}
      options={options}
      onChange={({values, selectedValue}) =>
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
