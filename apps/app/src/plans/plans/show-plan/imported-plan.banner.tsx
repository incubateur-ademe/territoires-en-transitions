'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  IMPORT_PLAN_DEMO_URL,
  IMPORT_PLAN_SUPPORT_URL,
} from '@/app/plans/plans/import-plan/import-plan-support.links';
import {
  PLAN_SECTEURS_LISTE,
  usePlanSecteursVue,
} from '@/app/plans/plans/secteurs-counts/use-plan-secteurs-vue';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Alert, Button, Icon, InlineLink } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useVerifyPlan } from './data/use-verify-plan';

type BannerStep = {
  isDone: boolean;
  title: string;
  description: string;
};

const BannerSteps = ({ steps }: { steps: BannerStep[] }) => (
  <ol className="flex flex-col gap-3 m-0 p-0 list-none">
    {steps.map((step, index) => (
      <li key={step.title} className="flex items-start gap-3 p-0">
        {steps.length > 1 && (
          <span
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              step.isDone
                ? 'bg-success-1 text-white'
                : 'border border-grey-5 bg-white text-grey-8'
            )}
          >
            {step.isDone ? <Icon icon="check-line" size="xs" /> : index + 1}
          </span>
        )}
        <div className="flex flex-col">
          {steps.length > 1 && (
            <span className="text-sm font-medium text-grey-9">
              {step.title}
            </span>
          )}
          <span className="text-sm text-grey-8">{step.description}</span>
        </div>
      </li>
    ))}
  </ol>
);

const SecteursButton = ({ count }: { count: number }) => {
  const [, setVue] = usePlanSecteursVue();
  return (
    <Button
      size="sm"
      onClick={() => void setVue(PLAN_SECTEURS_LISTE)}
      dataTest="plans.imported-plan-banner.secteurs"
    >
      {appLabels.planSecteursRenseignerManquants({ count })}
    </Button>
  );
};

const SupportLinks = () => (
  <p className="m-0 text-xs text-grey-7">
    {appLabels.planImporteBeta} {appLabels.planImporteBanniereDemoAvant}{' '}
    <InlineLink href={IMPORT_PLAN_DEMO_URL} openInNewTab>
      {appLabels.planImporteBanniereDemoLien}
    </InlineLink>{' '}
    {appLabels.planImporteBanniereSupportAvant}{' '}
    <InlineLink href={IMPORT_PLAN_SUPPORT_URL} openInNewTab>
      {appLabels.planImporteBanniereSupportLien}
    </InlineLink>{' '}
    {appLabels.planImporteBanniereSupportApres}
  </p>
);

/**
 * Plan importé par IA en attente de la validation d'un humain : renseigner
 * les secteurs que l'IA n'a pas su classer, puis vérifier et valider.
 */
export const ImportedPlanBanner = ({
  planId,
  isSecteursConcerne,
  secteursARenseigner,
  demarcheUrl,
}: {
  planId: number;
  /** Plan dont les actions portent un secteur réglementaire. */
  isSecteursConcerne: boolean;
  secteursARenseigner: number;
  /** Démarche qui tient le plan : le toast de validation y ramène. */
  demarcheUrl?: string;
}) => {
  const { mutate: verifyPlan, isPending } = useVerifyPlan(planId, {
    demarcheUrl,
  });
  // Validé, le plan n'a plus rien à vérifier : le panneau des secteurs se ferme.
  const { setPanel } = useSidePanel();

  const steps: BannerStep[] = [
    ...(isSecteursConcerne
      ? [
          {
            isDone: secteursARenseigner === 0,
            title: appLabels.planSecteursManquantsTitre,
            description:
              secteursARenseigner > 0
                ? appLabels.planSecteursManquantsIa({
                    count: secteursARenseigner,
                  })
                : appLabels.planSecteursTousRenseignes,
          },
        ]
      : []),
    {
      isDone: false,
      title: appLabels.planImporteEtapeStructureTitre,
      description: appLabels.planImporteEtapeStructureDescription,
    },
  ];

  return (
    <div data-test="plans.imported-plan-banner">
      <Alert
        state="warning"
        title={appLabels.planImporteBandeauTitre({ etapes: steps.length })}
        description={<BannerSteps steps={steps} />}
        footer={
          <div className="flex flex-col gap-4 mt-4">
            <div>
              {secteursARenseigner > 0 ? (
                <SecteursButton count={secteursARenseigner} />
              ) : (
                <Button
                  size="sm"
                  icon="check-line"
                  onClick={() =>
                    verifyPlan(
                      { planId },
                      { onSuccess: () => setPanel({ type: 'close' }) }
                    )
                  }
                  disabled={isPending}
                  dataTest="plans.imported-plan-banner.valider"
                >
                  {appLabels.planImporteValider}
                </Button>
              )}
            </div>
            <SupportLinks />
          </div>
        }
      />
    </div>
  );
};

/**
 * Plan associé à une démarche dont des actions n'ont pas de secteur
 * réglementaire : le dépôt pour avis l'exige.
 */
export const SecteursManquantsBanner = ({
  secteursARenseigner,
}: {
  secteursARenseigner: number;
}) => (
  <div data-test="plans.secteurs-manquants-banner">
    <Alert
      state="warning"
      title={appLabels.planSecteursManquantsTitre}
      description={appLabels.planSecteursManquantsAutres({
        count: secteursARenseigner,
      })}
      footer={
        <div className="mt-4">
          <SecteursButton count={secteursARenseigner} />
        </div>
      }
    />
  </div>
);
