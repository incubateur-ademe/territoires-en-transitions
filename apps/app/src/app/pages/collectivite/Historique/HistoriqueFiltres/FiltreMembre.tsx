import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Field, SelectFilter } from '@tet/ui';
import { FiltreProps } from '../filters';
import { useHistoriqueUtilisateurListe } from '../useHistoriqueUtilisateurListe';

const FiltreMembre = ({ filters, setFilters }: FiltreProps) => {
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
    <Field title={appLabels.membre} small>
      <SelectFilter
        small
        dataTest="filtre-membre"
        values={filters.modifiedBy ?? []}
        options={memberList}
        onChange={({ values }) =>
          setFilters({
            modifiedBy: values === undefined ? null : (values as string[]),
          })
        }
        disabled={memberList.length === 0}
      />
    </Field>
  );
};

export default FiltreMembre;
