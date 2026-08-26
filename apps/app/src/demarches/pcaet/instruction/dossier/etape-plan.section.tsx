'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { appLabels } from '@/app/labels/catalog';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import type { RouterOutput } from '@tet/api';
import { Accordion, cn, EmptyCard, Icon } from '@tet/ui';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];
type Plan = Dossier['plans'][number];
type Fiche = Plan['fiches'][number];

/**
 * Indentation d'un axe selon sa profondeur. Plafonnée : au-delà de trois
 * niveaux, décaler encore rendrait les titres illisibles sur la colonne étroite
 * du dossier, alors que la hiérarchie se lit déjà.
 */
const AXE_INDENT = ['pl-0', 'pl-4', 'pl-8', 'pl-12'] as const;
const indentOf = (depth: number) =>
  AXE_INDENT[Math.min(depth, AXE_INDENT.length) - 1] ?? AXE_INDENT[0];

const FicheList = ({ fiches }: { fiches: Fiche[] }) =>
  fiches.length === 0 ? (
    <p className="m-0 text-sm italic text-grey-6">
      {appLabels.instructionDossierAxeVide}
    </p>
  ) : (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {fiches.map((fiche) => (
        <li
          key={fiche.id}
          className="flex items-start gap-2 text-sm text-grey-9"
        >
          <Icon
            icon="file-text-line"
            size="sm"
            className="mt-0.5 shrink-0 text-primary-7"
          />
          {/* Pas de lien : la fiche appartient à la déposante, et l'écran qui
              l'affiche est fermé à l'instructeur. */}
          <span>
            {fiche.titre || appLabels.instructionDossierFicheSansTitre}
          </span>
        </li>
      ))}
    </ul>
  );

/**
 * `className` porte les marges : elles n'appartiennent pas au contenu mais à ce
 * qui l'encadre — l'intérieur d'un accordéon, ou rien du tout quand le plan
 * s'affiche à nu.
 */
const PlanContenu = ({
  plan,
  className,
}: {
  plan: Plan;
  className?: string;
}) => {
  if (plan.fiches.length === 0 && plan.axes.length === 0) {
    return (
      <p className={cn('m-0 text-sm italic text-grey-6', className)}>
        {appLabels.instructionDossierPlanVide}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Fiches rattachées au plan sans passer par un axe. */}
      {plan.fiches.length > 0 && <FicheList fiches={plan.fiches} />}

      {plan.axes.map((axe) => (
        <div key={axe.id} className={indentOf(axe.depth)}>
          <p className="mb-1 text-sm font-medium text-primary-9">
            {axe.nom || appLabels.instructionDossierAxeSansNom}
          </p>
          <FicheList fiches={axe.fiches} />
        </div>
      ))}
    </div>
  );
};

/**
 * Nom du plan suivi de son décompte, sur une seule ligne.
 *
 * Volontairement dans le titre et non dans le `subtitle` de l'accordéon :
 * celui-ci se rendrait sur une seconde ligne, et la flèche — centrée sur
 * l'en-tête — ne serait plus alignée avec le nom.
 */
const titreDuPlan = (plan: Plan) =>
  appLabels.instructionDossierPlanTitre({
    nom: plan.nom || appLabels.instructionDossierPlanSansNom,
    actions: appLabels.demarcheProgrammeNombreActions({
      count: plan.nbFiches,
    }),
  });

/** Encadrement d'un plan dans l'accordéon, quand il y en a plusieurs. */
const CARTE_PLAN = 'rounded-lg border border-grey-3 bg-white';

/**
 * Programme d'actions du dossier, en lecture seule.
 *
 * Rien n'est cliquable — ni le plan, ni ses actions. L'instructeur n'a aucun
 * droit sur les plans de la collectivité déposante : tout lien mènerait à un
 * écran qui le refuserait. Il lit ce que le dossier d'instruction lui expose.
 */
export const EtapePlanSection = ({ plans }: { plans: Dossier['plans'] }) => {
  if (plans.length === 0) {
    return (
      <DemarcheSection
        title={appLabels.instructionDossierEtapePlan}
        description={appLabels.instructionDossierEtapePlanDescription}
      >
        <EmptyCard
          picto={({ className }) => <PictoAction className={className} />}
          title={appLabels.instructionDossierPlanAucun}
        />
      </DemarcheSection>
    );
  }

  // Un seul plan — le cas courant : le contenu s'affiche à nu, sans carte ni
  // accordéon. Rien à replier ni à choisir, il n'y a pas de chrome à justifier.
  const [premierPlan] = plans;

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapePlan}
      description={appLabels.instructionDossierEtapePlanDescription}
    >
      {plans.length === 1 ? (
        <div
          className="flex flex-col gap-2"
          data-test="demarches.pcaet.instruction.plans"
        >
          <p
            className="m-0 text-base font-bold text-primary-9"
            data-test={`demarches.pcaet.instruction.plan-${premierPlan.id}`}
          >
            {titreDuPlan(premierPlan)}
          </p>
          <PlanContenu plan={premierPlan} />
        </div>
      ) : (
        <div
          className="flex flex-col gap-3"
          data-test="demarches.pcaet.instruction.plans"
        >
          {plans.map((plan, index) => (
            <Accordion
              key={plan.id}
              dataTest={`demarches.pcaet.instruction.plan-${plan.id}`}
              // Le premier est déplié : c'est celui que l'instructeur vient
              // lire, et un accordéon entièrement replié n'apprend rien.
              initialState={index === 0}
              title={titreDuPlan(plan)}
              content={<PlanContenu plan={plan} className="px-8 pb-6" />}
              containerClassname={CARTE_PLAN}
            />
          ))}
        </div>
      )}
    </DemarcheSection>
  );
};
