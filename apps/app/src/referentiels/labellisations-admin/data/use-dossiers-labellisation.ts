import { appLabels } from '@/app/labels/catalog';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useDownloadSignedFile } from '@/app/utils/use-download-signed-file';
import { RouterInput, RouterOutput, useTRPC, useTRPCClient } from '@tet/api';

export type ListDossiersLabellisationInput =
  RouterInput['referentiels']['labellisations']['admin']['listDossiers'];
export type DossierLabellisation =
  RouterOutput['referentiels']['labellisations']['admin']['listDossiers'][number];
export type DossierLabellisationDetail =
  RouterOutput['referentiels']['labellisations']['admin']['getDossier'];

export const useListDossiersLabellisation = (
  input: ListDossiersLabellisationInput
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.admin.listDossiers.queryOptions(input, {
      placeholderData: keepPreviousData,
    })
  );
};

export const useGetDossierLabellisation = (auditId: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.admin.getDossier.queryOptions({ auditId })
  );
};

/** Après toute modification, la fiche et la liste des dossiers sont à relire. */
const useInvalidateDossiers = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.admin.getDossier.pathKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.admin.listDossiers.pathKey(),
      }),
    ]);
};

export const useUpdateDemandeLabellisation = () => {
  const trpc = useTRPC();
  const invalidate = useInvalidateDossiers();
  return useMutation(
    trpc.referentiels.labellisations.admin.updateDemande.mutationOptions({
      meta: { success: appLabels.labellisationsAdminDemandeModifiee },
      onSuccess: invalidate,
    })
  );
};

export const useListAuditeurs = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.admin.listAuditeurs.queryOptions()
  );
};

export const useAddAuditeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDossiers();
  return useMutation(
    trpc.referentiels.labellisations.admin.addAuditeur.mutationOptions({
      meta: { success: appLabels.labellisationsAdminAuditeurAjoute },
      // Un ajout par email peut attribuer le rôle auditeur
      onSuccess: () =>
        Promise.all([
          invalidate(),
          queryClient.invalidateQueries({
            queryKey:
              trpc.referentiels.labellisations.admin.listAuditeurs.queryKey(),
          }),
        ]),
    })
  );
};

export const useRemoveAuditeur = () => {
  const trpc = useTRPC();
  const invalidate = useInvalidateDossiers();
  return useMutation(
    trpc.referentiels.labellisations.admin.removeAuditeur.mutationOptions({
      onSuccess: invalidate,
    })
  );
};

export const useCloseDossierLabellisation = () => {
  const trpc = useTRPC();
  const invalidate = useInvalidateDossiers();
  return useMutation(
    trpc.referentiels.labellisations.admin.closeDossier.mutationOptions({
      meta: { success: appLabels.labellisationsAdminDossierCloture },
      onSuccess: invalidate,
    })
  );
};

export const useListCot = (search: string) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.admin.listCot.queryOptions(
      { search: search || undefined },
      { placeholderData: keepPreviousData }
    )
  );
};

export const useToggleCotActif = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.referentiels.labellisations.admin.toggleCotActif.mutationOptions({
      meta: { success: appLabels.labellisationsAdminCotModifie },
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.admin.listCot.pathKey(),
        }),
    })
  );
};

/** Le programme TETE n'est pas forcément membre de la collectivité. */
export const useDownloadActeEngagement = () => {
  const trpcClient = useTRPCClient();
  return useDownloadSignedFile(
    async (
      input: RouterInput['referentiels']['labellisations']['admin']['getActeEngagementDownloadUrl']
    ) => {
      const { signedUrl, filename } =
        await trpcClient.referentiels.labellisations.admin.getActeEngagementDownloadUrl.mutate(
          input
        );
      return { url: signedUrl, filename };
    }
  );
};
