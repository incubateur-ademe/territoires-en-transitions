import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePartenaireListe} from '../data/options/usePartenaireListe';
import {TPartenaireInsert} from 'types/alias';
import {formatNewTag} from '../data/utils';
import {useTagUpdate} from 'ui/DropdownLists/hooks/useTagUpdate';
import {useDeleteTag} from 'ui/DropdownLists/hooks/useTagDelete';

type Props = {
  partenaires: TPartenaireInsert[] | null;
  onSelect: (partenaires: TPartenaireInsert[]) => void;
  isReadonly: boolean;
};

const PartenairesDropdown = ({partenaires, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: partenaireListe} = usePartenaireListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['partenaires', collectivite_id],
    tagTableName: 'partenaire_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['partenaires', collectivite_id],
    tagTableName: 'partenaire_tag',
  });

  const options: TOption[] = partenaireListe
    ? partenaireListe.map(partenaire => ({
        value: partenaire.id.toString(),
        label: partenaire.nom,
      }))
    : [];

  const formatPartenaires = (values: string[]) =>
    partenaireListe?.filter(partenaire =>
      values.some(v => v === partenaire.id?.toString())
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={partenaires?.map((s: TPartenaireInsert) =>
        s.id ? s.id.toString() : ''
      )}
      options={options}
      onSelect={values => {
        onSelect(formatPartenaires(values));
      }}
      onCreateClick={inputValue =>
        onSelect(
          partenaires
            ? [...partenaires, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      onUpdateTagName={(tag_id, tag_name) =>
        updateTag({
          collectivite_id: collectivite_id!,
          id: parseInt(tag_id),
          nom: tag_name,
        })
      }
      onDeleteClick={tag_id => deleteTag(parseInt(tag_id))}
      userCreatedTagIds={partenaireListe?.map(p => p.id.toString())}
      disabled={isReadonly}
    />
  );
};

export default PartenairesDropdown;
