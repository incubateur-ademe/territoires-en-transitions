import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {ToastAlert, useToastAlert} from 'ui/shared/ToastAlert';
import {DCP} from './AuthProvider';

/**
 * Met à jour les DCP de l'utilisateur courant
 */
export const useUpdateDCP = (user_id: string) => {
  const queryClient = useQueryClient();

  const toastAlert = useToastAlert();

  const toastLabelByStatus = {
    success: 'La modification est enregistrée',
    error: "La modification n'a pas été enregistrée",
  };

  const renderToast = () => (
    <ToastAlert toastAlert={toastAlert}>
      {status => (status ? toastLabelByStatus[status] : '')}
    </ToastAlert>
  );

  const {mutate} = useMutation(updateDCP, {
    onSuccess: () => {
      queryClient.invalidateQueries(['dcp', user_id]);
      toastAlert.showSuccess();
    },
    onError: toastAlert.showError,
  });

  const handleUpdateDCP = (dcp: DCP) => mutate(dcp);

  return {handleUpdateDCP, renderToast};
};

/**
 * Query pour mettre à jour les DCP de l'utilisateur courant
 */
const updateDCP = async (dcp: DCP) => {
  const {error} = await supabaseClient.from('dcp').update([dcp]);
  if (error) throw error?.message;
};
