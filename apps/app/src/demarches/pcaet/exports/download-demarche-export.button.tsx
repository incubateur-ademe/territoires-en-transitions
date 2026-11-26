'use client';

import { appLabels } from '@/app/labels/catalog';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import { Button, Event, useEventTracker } from '@tet/ui';
import { useDownloadDemarcheExport } from './data/use-download-demarche-export';
import {
  useListDemarcheExports,
  type DemarcheExportEntry,
  type DemarcheExportsRef,
  type DemarcheExportType,
} from './data/use-list-demarche-exports';

const LABELS: Record<DemarcheExportType, string> = {
  plan: appLabels.pcaetExportTelechargerPlan,
  indicateurs: appLabels.pcaetExportTelechargerIndicateurs,
};

const versionLabel = (entry: DemarcheExportEntry): string => {
  if (entry.source === 'on_demand') {
    return appLabels.pcaetExportDonneesDuJour;
  }
  const date = new Date(entry.createdAt).toLocaleDateString('fr-FR');
  return entry.transition === DemarchePcaetTransitionEnum.PUBLIER
    ? appLabels.pcaetExportVersionPubliee({ date })
    : appLabels.pcaetExportVersionTransmise({ date });
};

/**
 * Le classeur d'une étape du dépôt, avec la version qu'il contient. Rien n'est
 * rendu tant que la liste charge, ni quand il n'y a rien à télécharger
 * (dépôt en élaboration) : pas de bouton qui apparait puis disparait.
 */
export const DownloadDemarcheExportButton = ({
  dossierRef,
  type,
}: {
  dossierRef: DemarcheExportsRef;
  type: DemarcheExportType;
}) => {
  const { data } = useListDemarcheExports(dossierRef);
  const entry = data?.[type] ?? null;
  const tracker = useEventTracker();
  const { download, isDownloading } = useDownloadDemarcheExport({
    dossierRef,
    type,
    source: entry?.source,
    onDownloaded: () => {
      if (entry === null) {
        return;
      }
      tracker(Event.demarches.pcaet.classeurTelecharge, {
        acteur: 'demandeAvisId' in dossierRef ? 'instructeur' : 'collectivite',
        type,
        source: entry.source,
        transition: entry.source === 'snapshot' ? entry.transition : undefined,
      });
    },
  });

  if (entry === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        icon="download-line"
        size="xs"
        variant="outlined"
        loading={isDownloading}
        disabled={isDownloading}
        onClick={download}
        dataTest={`demarches.pcaet.exports.download-${type}-button`}
      >
        {LABELS[type]}
      </Button>
      <span className="text-xs text-grey-7">{versionLabel(entry)}</span>
    </div>
  );
};
