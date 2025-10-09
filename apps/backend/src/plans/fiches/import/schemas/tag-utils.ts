import { TagType } from '@/backend/collectivites/tags/tag.table-base';
import { TagImport } from '@/backend/plans/fiches/import/import-plan.dto';

/**
 * Get an existing tag with the same name and type or create a new one
 * Matches ImportPlanCleanService.getOrCreateTag behavior
 */
export const getOrCreateTag = (
  tagName: string | undefined,
  tagType: TagType,
  existingTags: Set<TagImport>
): TagImport | undefined => {
  if (!tagName) return undefined;

  // Try to find existing tag
  const existing = [...existingTags].find(
    (tag) => tag.nom === tagName && tag.type === tagType
  );
  if (existing) {
    return existing;
  }

  // Create new tag
  const newTag: TagImport = {
    nom: tagName,
    type: tagType,
  };
  existingTags.add(newTag);
  return newTag;
};
