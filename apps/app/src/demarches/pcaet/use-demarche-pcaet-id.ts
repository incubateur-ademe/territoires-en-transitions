'use client';

import { notFound, useParams } from 'next/navigation';

/**
 * Id de la démarche courante, lu depuis le segment de route
 * [demarchePcaetId] (validé par le layout du segment).
 */
export const useDemarchePcaetId = (): number => {
  const params = useParams<{ demarchePcaetId: string }>();
  const demarcheId = Number(params.demarchePcaetId);
  if (!Number.isInteger(demarcheId) || demarcheId <= 0) {
    notFound();
  }
  return demarcheId;
};
