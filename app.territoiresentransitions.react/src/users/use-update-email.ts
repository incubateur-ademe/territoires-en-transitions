import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation } from '@tanstack/react-query';

export interface UpdateEmailParams {
  email: string;
}

/**
 * Met à jour l'email de l'utilisateur courant
 */
export const useUpdateEmail = () => {
  const supabase = useSupabase();

  const { mutate } = useMutation({
    mutationFn: async ({ email }: UpdateEmailParams) => {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error?.message;
    },
  });

  const handleUpdateEmail = (email: UpdateEmailParams) => {
    mutate(email);
  };

  return { handleUpdateEmail };
};
