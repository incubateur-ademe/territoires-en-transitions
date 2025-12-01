import { useMutation } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';
import { useRouter } from 'next/navigation';

export interface UpdateEmailParams {
  email: string;
}

/**
 * Met à jour l'email de l'utilisateur courant
 */
export const useUpdateEmail = () => {
  const supabase = useSupabase();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email }: UpdateEmailParams) => {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error?.message;
    },
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleUpdateEmail = (email: UpdateEmailParams) => {
    mutate(email);
  };

  return { handleUpdateEmail, isPending };
};
