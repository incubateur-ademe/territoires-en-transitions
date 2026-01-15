import { QueryClient } from '@tanstack/react-query';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { AppRouter } from '@tet/api';
import { TagType } from '@tet/domain/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';

const hasTagInFiche = (
  fiche: FicheWithRelations | undefined,
  tagType: TagType,
  tagId: number
) => {
  if (!fiche) return false;

  switch (tagType) {
    case 'personne':
      return (
        (fiche.pilotes?.some((personne) => personne.tagId === tagId) ?? false) ||
        (fiche.referents?.some((personne) => personne.tagId === tagId) ?? false)
      );
    case 'service':
      return fiche.services?.some((tag) => tag.id === tagId) ?? false;
    case 'financeur':
      return (
        fiche.financeurs?.some(
          (financeur) =>
            financeur.financeurTagId === tagId ||
            financeur.financeurTag.id === tagId
        ) ?? false
      );
    case 'structure':
      return fiche.structures?.some((tag) => tag.id === tagId) ?? false;
    case 'partenaire':
      return fiche.partenaires?.some((partenaire) => partenaire.id === tagId) ?? false;
    case 'instanceGouvernance':
      return fiche.instanceGouvernance?.some((tag) => tag.id === tagId) ?? false;
    case 'libre':
      return fiche.libreTags?.some((tag) => tag.id === tagId) ?? false;
  }
};

export const invalidateFicheQueriesByTag = ({
  queryClient,
  trpc,
  tagType,
  tagId,
}: {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
  tagType: TagType;
  tagId: number;
}) => {
  return queryClient.invalidateQueries({
    queryKey: trpc.plans.fiches.get.queryKey(),
    predicate: (query) =>
      hasTagInFiche(query.state.data as FicheWithRelations | undefined, tagType, tagId),
  });
};
