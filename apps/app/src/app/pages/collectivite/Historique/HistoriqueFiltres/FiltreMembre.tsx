import { useCollectiviteId } from '@/api/collectivites';
import { Field, SelectFilter } from '@/ui';
import { TFiltreProps } from '../filters';
import { useHistoriqueUtilisateurListe } from '../useHistoriqueUtilisateurListe';

const FiltreMembre = ({ filters, setFilters }: TFiltreProps) => {
  const collectiviteId = useCollectiviteId();
  const utilisateurs = useHistoriqueUtilisateurListe(collectiviteId);

  const memberList = (utilisateurs ?? [])
    .filter(
      (u): u is { modified_by_id: string; modified_by_nom: string } =>
        u.modified_by_id !== null && u.modified_by_nom !== null
    )
    .map((u) => ({
      value: u.modified_by_id,
      label: u.modified_by_nom,
    }));

  return (
    <Field title="Membre">
      <SelectFilter
        dataTest="filtre-membre"
        values={filters.modified_by}
        options={memberList}
        onChange={({ values }) => {
          if (values === undefined) {
            delete filters.modified_by;
            return setFilters({ ...filters });
          } else {
            return setFilters({
              ...filters,
              modified_by: values as string[],
            });
          }
        }}
        disabled={memberList.length === 0}
      />
    </Field>
  );
};

export default FiltreMembre;
