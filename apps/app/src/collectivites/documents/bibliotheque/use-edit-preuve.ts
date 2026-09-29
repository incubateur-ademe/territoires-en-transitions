import { useMutation } from '@tanstack/react-query';
import { getDocumentFichier } from './to-document-collectivite.utils';
import { useTRPC, useTRPCClient } from '@tet/api';
import { Lien } from '@tet/domain/collectivites';
import { toDocumentTargets } from '../to-document-target';
import { useInvalidateDocuments } from '../use-invalidate-documents';
import { EditHandlers, DocumentRattache } from './types';
import { useEditFilenameState, useEditState } from './use-edit-state';

type EditPreuve = (preuve: DocumentRattache) => EditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: EditPreuve = (preuve) => {
  const {
    mutate: removePreuve,
    isPending: isRemovePreuveLoading,
    isError: isRemovePreuveError,
  } = useRemovePreuve();
  const {
    mutate: updatePreuveCommentaire,
    isPending: isUpdateCommentaireLoadind,
    isError: isUpdateCommentaireError,
  } = useUpdatePreuveCommentaire();
  const {
    mutate: updateBibliothequeFichier,
    isPending: isUpdateFilenameLoading,
    isError: isUpdateFilenameError,
  } = useUpdateBibliothequeFichier();
  const { commentaire } = preuve;
  const fichier = getDocumentFichier(preuve);
  const editComment = useEditState({
    initialValue: commentaire,
    onUpdate: (updatedComment) =>
      updatePreuveCommentaire({ ...preuve, commentaire: updatedComment }),
  });
  const editFilename = useEditFilenameState({
    initialValue: fichier?.filename,
    onUpdate: (updatedFilename) => {
      if (!fichier) {
        return;
      }
      updateBibliothequeFichier({
        collectiviteId: preuve.collectiviteId,
        hash: fichier.hash,
        filename: updatedFilename,
      });
    },
  });

  const remove = () => {
    removePreuve(preuve);
  };

  return {
    remove,
    editComment,
    editFilename,
    isLoading:
      isRemovePreuveLoading ||
      isUpdateCommentaireLoadind ||
      isUpdateFilenameLoading,
    isError:
      isRemovePreuveError || isUpdateCommentaireError || isUpdateFilenameError,
  };
};

// renvoie une fonction de suppression d'une preuve
export const useRemovePreuve = () => {
  const trpcClient = useTRPCClient();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation({
    mutationFn: async (preuve: DocumentRattache) => {
      const { id } = preuve;
      return trpcClient.collectivites.documents.removePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuveType,
      });
    },

    onSuccess: (_data, variables) =>
      invalidateDocuments(...toDocumentTargets(variables)),
  });
};

// renvoie une fonction de modification d'une preuve de type lien
export const useUpdatePreuveLien = () => {
  const trpcClient = useTRPCClient();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation({
    mutationFn: async (preuve: DocumentRattache & { lien: Lien }) =>
      trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: preuve.id,
        preuveType: preuve.preuveType,
        lien: preuve.lien,
      }),

    onSuccess: (_data, variables) =>
      invalidateDocuments(...toDocumentTargets(variables)),
  });
};

// renvoie une fonction de modification du commentaire d'une preuve
export const useUpdatePreuveCommentaire = () => {
  const trpcClient = useTRPCClient();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation({
    mutationFn: async (preuve: DocumentRattache) => {
      const { id, commentaire } = preuve;
      return trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuveType,
        commentaire: commentaire ?? '',
      });
    },

    onSuccess: (_data, variables) =>
      invalidateDocuments(...toDocumentTargets(variables)),
  });
};

// renvoie une fonction de mise à jour d'un fichier de la bibliothèque (nom et/ou confidentiel)
export const useUpdateBibliothequeFichier = () => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation(
    trpc.collectivites.documents.update.mutationOptions({
      onSuccess: (_data, { collectiviteId }) => {
        void invalidateDocuments({
          type: 'bibliothequeFichier',
          collectiviteId,
        });
      },
    })
  );
};
