import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useState } from 'react';
import { useSwitchToTe } from './use-switch-to-te';

export type SwitchToTeStep =
  | 'info'
  | 'confirmation'
  | 'progress'
  | 'success'
  | 'error';

export function useSwitchToTeConfirmState() {
  const collectiviteId = useCollectiviteId();
  const { mutate, isPending, isSuccess, isError, error, reset, applySwitch } =
    useSwitchToTe();

  const [etape, setEtape] = useState<'info' | 'confirmation'>('info');
  const [hasExported, setHasExported] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const step: SwitchToTeStep = isPending
    ? 'progress'
    : isSuccess
    ? 'success'
    : isError
    ? 'error'
    : etape;

  const textConfirmed =
    confirmText.trim().toUpperCase() === appLabels.switchToTeConfirmKeyword;

  return {
    step,
    hasExported,
    setHasExported,
    confirmText,
    setConfirmText,
    textConfirmed,
    canSubmit: hasExported && textConfirmed,
    error,
    applySwitch,
    goToInfo: () => setEtape('info'),
    goToConfirmation: () => setEtape('confirmation'),
    retry: () => {
      reset();
      setEtape('confirmation');
    },
    submit: () => mutate({ collectiviteId }),
  };
}

export type SwitchToTeConfirmState = ReturnType<typeof useSwitchToTeConfirmState>;
