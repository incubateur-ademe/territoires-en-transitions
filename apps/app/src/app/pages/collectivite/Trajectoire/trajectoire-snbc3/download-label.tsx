import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReactNode } from 'react';

/** Libellé d'un bouton de téléchargement, remplacé par un spinner pendant le téléchargement. */
export const DownloadLabel = ({
  isPending,
  children,
}: {
  isPending: boolean;
  children: ReactNode;
}) =>
  isPending ? (
    <>
      {appLabels.telechargementEnCours} <SpinnerLoader />
    </>
  ) : (
    children
  );
