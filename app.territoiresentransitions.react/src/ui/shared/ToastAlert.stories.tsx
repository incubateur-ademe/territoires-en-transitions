import React, {useEffect} from 'react';
import {ToastAlert, useToastAlert} from './ToastAlert';

export default {
  component: ToastAlert,
};

const toastLabelByStatus = {
  success: 'La modification est enregistrée',
  error: "La modification n'a pas été enregistrée",
};

// const renderToast = () => (
//   <ToastAlert toastAlert={toastAlert}>
//     {status => (status ? toastLabelByStatus[status] : '')}
//   </ToastAlert>
// );

export const Success = () => {
  const toastAlert = useToastAlert();
  useEffect(() => {
    toastAlert.showSuccess();
  }, []);
  return (
    <ToastAlert toastAlert={toastAlert}>
      {status => (status ? toastLabelByStatus[status] : '')}
    </ToastAlert>
  );
};

export const Error = () => {
  const toastAlert = useToastAlert();
  useEffect(() => {
    toastAlert.showError();
  }, []);
  return (
    <ToastAlert toastAlert={toastAlert}>
      {status => (status ? toastLabelByStatus[status] : '')}
    </ToastAlert>
  );
};
