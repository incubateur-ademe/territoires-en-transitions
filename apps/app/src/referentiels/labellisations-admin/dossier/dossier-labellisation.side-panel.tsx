'use client';

import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect } from 'react';
import { DossierLabellisationView } from './dossier-labellisation.view';

/** Dossier affiché dans le side panel, porté par l'URL pour être partageable. */
export const useOpenDossierId = () => useQueryState('dossier', parseAsInteger);

const dossierPanel = (auditId: number) =>
  ({
    type: 'open',
    title: '',
    content: <DossierLabellisationView key={auditId} auditId={auditId} />,
  } as const);

/**
 * Ouvre le dossier dans le side panel et l'inscrit dans l'URL.
 *
 * Le panneau s'ouvre ici, et non dans un effet qui suivrait l'URL : entre
 * l'écriture optimiste de nuqs et la mise à jour du routeur Next, le rendu
 * provoqué par l'ouverture relit un instant l'ancienne URL, sans `dossier`, et
 * un tel effet refermerait aussitôt le panneau.
 */
export const useOpenDossier = () => {
  const [, setAuditId] = useOpenDossierId();
  const { setPanel } = useSidePanel();
  return useCallback(
    (auditId: number) => {
      setAuditId(auditId);
      setPanel(dossierPanel(auditId));
    },
    [setAuditId, setPanel]
  );
};

/**
 * Ouvre au chargement le dossier présent dans l'URL, et retire `dossier` de
 * l'URL à la fermeture du panneau.
 */
export const DossierLabellisationSidePanel = () => {
  const [auditId, setAuditId] = useOpenDossierId();
  const onClose = useCallback(() => setAuditId(null), [setAuditId]);
  const { setPanel } = useSidePanel({ onClose });

  // Au montage seulement : les ouvertures suivantes passent par `useOpenDossier`.
  useEffect(() => {
    if (auditId !== null) {
      setPanel(dossierPanel(auditId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
