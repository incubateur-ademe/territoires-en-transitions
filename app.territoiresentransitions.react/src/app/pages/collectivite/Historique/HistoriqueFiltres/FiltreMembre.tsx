import { useCollectiviteId } from '@/api/collectivites';
import { Field, SelectFilter } from '@/ui';
import { TFiltreProps } from '../filters';
import { useHistoriqueUtilisateurListe } from '../useHistoriqueUtilisateurListe';

const FiltreMembre = ({ filters, setFilters }: TFiltreProps) => {
  const collectivite_id = useCollectiviteId();
  const utilisateurs = useHistoriqueUtilisateurListe(collectivite_id!);

  // Initialisation du tableau d'options
  const memberList: { value: string; label: string }[] = [];

  // Transformation et ajout des données membres au tableau d'options
  utilisateurs &&
    utilisateurs.forEach((u) =>
      memberList.push({ value: u.modified_by_id!, label: u.modified_by_nom! })
    );

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
