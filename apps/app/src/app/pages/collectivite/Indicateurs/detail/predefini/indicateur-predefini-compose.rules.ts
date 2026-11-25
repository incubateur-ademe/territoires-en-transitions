export const isComposeSansAgregation = ({
  enfants,
  sansValeurUtilisateur,
}: {
  enfants: readonly unknown[];
  sansValeurUtilisateur: boolean;
}): boolean => enfants.length > 0 && sansValeurUtilisateur;
