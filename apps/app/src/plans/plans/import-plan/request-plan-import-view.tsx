'use client';
import { appLabels } from '@/app/labels/catalog';
import { useRouter } from 'next/navigation';

import {
  Button,
  ButtonMenu,
  Event,
  Icon,
  InlineLink,
  useEventTracker,
} from '@tet/ui';

const DOWNLOAD_TEMPLATE_OPTIONS = [
  { value: 'xlsx', label: appLabels.formatExcel },
  { value: 'ods', label: appLabels.formatOpenDocument },
];

export const RequestPlanImportView = () => {
  const router = useRouter();
  const goBackToPreviousPage = () => {
    router.back();
  };
  return (
    <>
      <h3 className="mb-8">
        <Icon icon="import-fill" size="lg" className="mr-2" />
        {appLabels.importerUnPlan}
      </h3>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
        <div className="mb-1 text-sm">{appLabels.etape({ index: 1 })}</div>
        <h6 className="mb-4">
          {appLabels.importPlanTelechargerModeleEtapeTitre}
        </h6>
        <p className="mb-4">{appLabels.importPlanModeleStructureFormat}</p>
        <DownloadMenu />
        <div className="h-[1px] my-8 bg-gray-300" />

        <div className="mb-1 text-sm">{appLabels.etape({ index: 2 })}</div>
        <h6 className="mb-4">
          {appLabels.importPlanCompleterFichierEtapeTitre}
        </h6>
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
        <div className="h-[1px] my-8 bg-gray-300" />

        <div className="flex gap-6 mt-3">
          <Button
            variant="outlined"
            icon="arrow-left-line"
            size="sm"
            onClick={goBackToPreviousPage}
            type="button"
          >
            {appLabels.annuler}
          </Button>
        </div>
      </div>
    </>
  );
};

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
