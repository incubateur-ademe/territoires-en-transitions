import { useCollectiviteId } from '@tet/api/collectivites';
import { Field, SelectFilter } from '@tet/ui';
import { TFiltreProps } from '../filters';
import { useHistoriqueUtilisateurListe } from '../useHistoriqueUtilisateurListe';

const FiltreMembre = ({ filters, setFilters }: TFiltreProps) => {
  const collectiviteId = useCollectiviteId();
  const utilisateurs = useHistoriqueUtilisateurListe(collectiviteId);

  const memberList = (utilisateurs ?? [])
    .filter(
      (u): u is { modifiedById: string; modifiedByNom: string } =>
        u.modifiedById !== null && u.modifiedByNom !== null
    )
    .map((u) => ({
      value: u.modifiedById,
      label: u.modifiedByNom,
    }));

  return (
    <Field title="Membre" small>
      <SelectFilter
        small
        dataTest="filtre-membre"
        values={filters.modifiedBy ?? []}
        options={memberList}
        onChange={({ values }) => {
          if (values === undefined) {
            const { modifiedBy, ...rest } = filters;
            return setFilters({ modifiedBy: null, ...rest });
          } else {
            return setFilters({
              ...filters,
              modifiedBy: values as string[],
            });
          }
        }}
        disabled={memberList.length === 0}
      />
    </Field>
  );
};

export default FiltreMembre;
