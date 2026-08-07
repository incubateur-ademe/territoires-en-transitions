'use client';

import { notFound, useParams } from 'next/navigation';

/**
 * Id de la démarche courante, lu depuis le segment de route
 * [demarcheId] (validé par le layout du segment).
 */
export const useDemarcheId = (): number => {
  const params = useParams<{ demarcheId: string }>();
  const demarcheId = Number(params.demarcheId);
  if (!Number.isInteger(demarcheId) || demarcheId <= 0) {
    notFound();
  }
  return demarcheId;
};
