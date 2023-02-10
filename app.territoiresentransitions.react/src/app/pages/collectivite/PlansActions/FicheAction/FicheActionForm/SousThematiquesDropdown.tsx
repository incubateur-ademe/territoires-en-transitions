import {useEffect} from 'react';
import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import {useSousThematiqueListe} from '../data/options/useSousThematiqueListe';
import {TSousThematiqueRow} from '../data/types/alias';

type Props = {
  thematiques: string[];
  sousThematiques: TSousThematiqueRow[] | null;
  onSelect: (thematique: TSousThematiqueRow[]) => void;
};

const SousThematiquesDropdown = ({
  thematiques,
  sousThematiques,
  onSelect,
}: Props) => {
  const {data: sousThematiqueListe} = useSousThematiqueListe();

  const options: TOption[] = sousThematiqueListe
    ? sousThematiqueListe
        .filter(st => thematiques.some(t => st.thematique === t))
        .map(thematique => ({
          value: thematique.id.toString(),
          label: thematique.sous_thematique,
        }))
    : [];

  const formatThematiques = (values: string[]) =>
    sousThematiqueListe?.filter(thematique =>
      values.some(v => v === thematique.id.toString())
    ) ?? [];

  /** Supprime les sous-thématiques quand une thématique est supprimée de la fiche */
  useEffect(() => {
    if (sousThematiques) {
      // récupère la liste des thématiques incluent dans les sous-thématiques
      const sousThematiqueThematiques: string[] = [];
      sousThematiques.forEach(st => {
        if (!sousThematiqueThematiques.some(stt => stt === st.thematique)) {
          sousThematiqueThematiques.push(st.thematique);
        }
      });

      // si les listes sont différentes, on update la fiche
      if (
        sousThematiqueThematiques.some(stt => !thematiques.some(t => t === stt))
      ) {
        const newSousThematiques = sousThematiques.filter(st =>
          thematiques.some(stt => stt === st.thematique)
        );
        onSelect(newSousThematiques);
      }
    }
  }, [thematiques.join()]);

  // On invalide la liste des options dans useEditFicheAction
  return (
    <MultiSelectTagsDropdown
      disabled={thematiques.length === 0}
      containerWidthMatchButton
      buttonClassName={DSFRbuttonClassname}
      values={sousThematiques?.map((t: TSousThematiqueRow) => t.id.toString())}
      options={options}
      onSelect={values => onSelect(formatThematiques(values))}
    />
  );
};

export default SousThematiquesDropdown;
