import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation} from 'react-query';
import {ToastAlert, useToastAlert} from 'ui/shared/ToastAlert';

export interface UpdateEmailParams {
  email: string;
}

/**
 * Met à jour l'email de l'utilisateur courant
 */
export const useUpdateEmail = () => {
  const toastAlert = useToastAlert();

  const toastLabelByStatus = {
    success: 'Le nouvel email est enregistrée',
    error: "Le nouvel email n'a pas pu être enregistré",
  };

  const renderToast = () => (
    <ToastAlert toastAlert={toastAlert}>
      {status => (status ? toastLabelByStatus[status] : '')}
    </ToastAlert>
  );

  const {mutate} = useMutation(updateEmail, {
    onSuccess: () => {
      toastAlert.showSuccess();
    },
    onError: toastAlert.showError,
  });

  const handleUpdateEmail = (email: UpdateEmailParams) => {
    mutate(email);
  };

  return {handleUpdateEmail, renderToast};
};

/**
 * Query pour mettre à jour l'email de l'utilisateur courant
 */
export const updateEmail = async ({email}: UpdateEmailParams) => {
  const {error} = await supabaseClient.auth.update({email});
  if (error) throw error?.message;
};
