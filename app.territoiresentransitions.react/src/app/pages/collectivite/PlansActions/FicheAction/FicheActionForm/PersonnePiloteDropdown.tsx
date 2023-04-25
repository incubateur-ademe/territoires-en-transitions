import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {Personne} from '../data/types';
import {formatNewTag, getPersonneId} from '../data/utils';
import {usePersonneListe} from '../data/options/usePersonneListe';
import {useDeleteTag} from '../data/options/useTagDelete';
import {useTagUpdate} from '../data/options/useTagUpdate';

type Props = {
  ficheId: number | null;
  personnes: Personne[] | null;
  onSelect: (personnes: Personne[]) => void;
  isReadonly: boolean;
};

const PersonnePiloteDropdown = ({
  ficheId,
  personnes,
  onSelect,
  isReadonly,
}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonneListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
    keysToInvalidate: [['fiche_action', ficheId?.toString()]],
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
    keysToInvalidate: [['fiche_action', ficheId?.toString()]],
  });

  const options: TOption[] = personneListe
    ? personneListe.map(personne => ({
        value: getPersonneId(personne),
        label: personne.nom!,
      }))
    : [];

  const formatPersonnePilote = (values: string[]) =>
    personneListe?.filter(personne =>
      values.some(v => v === getPersonneId(personne))
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction
  return (
    <SelectCreateTagsDropdown
      data-test="PersonnePilote"
      values={personnes?.map((personne: Personne) => getPersonneId(personne))}
      options={options}
      onSelect={values => onSelect(formatPersonnePilote(values))}
      onCreateClick={inputValue =>
        onSelect(
          personnes
            ? [...personnes, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      onDeleteClick={tag_id => deleteTag(parseInt(tag_id))}
      onUpdateTagName={(tag_id, tag_name) =>
        updateTag({
          collectivite_id: collectivite_id!,
          id: parseInt(tag_id),
          nom: tag_name,
        })
      }
      userCreatedTagIds={personneListe
        ?.filter(p => p.tag_id)
        .map(p => p.tag_id!.toString())}
      placeholderText="Créer un tag..."
      disabled={isReadonly}
    />
  );
};

export default PersonnePiloteDropdown;
