import { TableTag } from '@tet/api';
import { TagEnum, TagType } from '@tet/domain/collectivites';

/**
 * Maps TableTag (e.g., 'financeur_tag') to TagType (e.g., 'financeur')
 */
export function tableTagToTagType(tableTag: TableTag): TagType {
  const mapping: Record<TableTag, TagType> = {
    financeur_tag: TagEnum.Financeur,
    libre_tag: TagEnum.Libre,
    partenaire_tag: TagEnum.Partenaire,
    personne_tag: TagEnum.Personne,
    service_tag: TagEnum.Service,
    structure_tag: TagEnum.Structure,
  };

  return mapping[tableTag];
}
