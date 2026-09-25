'use client';
import { appLabels } from '@/app/labels/catalog';
import { ButtonMenu, Event, InlineLink, useEventTracker } from '@tet/ui';

const DOWNLOAD_TEMPLATE_OPTIONS = [
  { value: 'xlsx', label: appLabels.formatExcel },
  { value: 'ods', label: appLabels.formatOpenDocument },
];

/**
 * Import accompagné : la collectivité remplit le modèle et l'envoie à
 * l'équipe, qui réalise l'import.
 */
export const RequestPlanImportSteps = () => (
  <>
    <div className="mb-1 text-sm">{appLabels.etape({ index: 1 })}</div>
    <h6 className="mb-4">{appLabels.importPlanTelechargerModeleEtapeTitre}</h6>
    <p className="mb-4">{appLabels.importPlanModeleStructureFormat}</p>
    <DownloadMenu />
    <div className="h-[1px] my-8 bg-gray-300" />

    <div className="mb-1 text-sm">{appLabels.etape({ index: 2 })}</div>
    <h6 className="mb-4">{appLabels.importPlanCompleterFichierEtapeTitre}</h6>
    <p>{appLabels.importPlanModeleDescription}</p>
    <p className="mb-0">{appLabels.importPlanConsignesRespect}</p>
    <div className="h-[1px] my-8 bg-gray-300" />

    <div className="mb-1 text-sm">{appLabels.etape({ index: 3 })}</div>
    <h6 className="mb-4">{appLabels.importPlanEnvoyerEmailEtapeTitre}</h6>
    <p>
      {appLabels.importPlanAdresseLabel}{' '}
      <span className="font-bold">{appLabels.importPlanContactEmail}</span>
    </p>
    <p className="mb-0">{appLabels.importPlanContactRelance}</p>

    <div className="h-[1px] my-8 bg-gray-300" />

    <div className="mb-1 text-sm">{appLabels.etape({ index: 4 })}</div>
    <h6 className="mb-4">{appLabels.importPlanRealiseEtapeTitre}</h6>
    <ul className="mb-0">
      <li>
        {appLabels.importPlanDemoPostImport}{' '}
        <InlineLink
          href="https://calendly.com/territoiresentransitions/demo-optimisation-pilotage-actions"
          openInNewTab
        >
          {appLabels.enCliquantIci}
        </InlineLink>
      </li>
      <li>
        {appLabels.importPlanArticleProchainesEtapes}{' '}
        <InlineLink
          href="https://aide.territoiresentransitions.fr/fr/article/plan-daction-en-ligne-les-prochaines-etapes-lx9mnb"
          openInNewTab
        >
          {appLabels.enCliquantIci}
        </InlineLink>
      </li>
    </ul>
    <div className="h-[1px] my-8 bg-gray-300" />
    <h6 className="mb-4">{appLabels.ressources}</h6>
    <ul className="mb-0">
      <li>
        {appLabels.importPlanVideoPresentation}{' '}
        <InlineLink
          href="https://www.youtube.com/watch?v=o0M4VdQ8bEc"
          openInNewTab
        >
          {appLabels.enCliquantIci}
        </InlineLink>
      </li>
      <li>
        {appLabels.importPlanRendezVousEquipe}{' '}
        <InlineLink
          href="https://calendly.com/territoiresentransitions/entretien-support-plan-d-action"
          openInNewTab
        >
          {appLabels.enCliquantIci}
        </InlineLink>
      </li>
    </ul>
  </>
);

const DownloadMenu = () => {
  const trackEvent = useEventTracker();
  return (
    <ButtonMenu
      icon="download-line"
      size="sm"
      menu={{
        actions: DOWNLOAD_TEMPLATE_OPTIONS.map((option) => ({
          label: option.label,
          onClick: () => {
            trackEvent(Event.fiches.downloadModele, {
              format: option.value,
            });
            window.open(`/modele-import-pa.${option.value}`, '_blank');
          },
        })),
      }}
    >
      {appLabels.importPlanTelechargerModele}
    </ButtonMenu>
  );
};
