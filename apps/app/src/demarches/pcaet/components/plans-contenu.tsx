'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import type { RouterOutput } from '@tet/api';
import { Accordion, cn, EmptyCard, Icon } from '@tet/ui';

/**
 * Un plan et son contenu aplati. Les deux routes qui l'exposent — le dossier
 * d'instruction et le rappel de la déposante — partagent le même schéma côté
 * serveur : ce type en tient lieu pour les deux.
 */
export type PlanContenuAffiche =
  RouterOutput['demarches']['pcaet']['listPlans'][number];

type Fiche = PlanContenuAffiche['fiches'][number];

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
      {appLabels.demarchePlanContenuAxeVide}
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
          {/* Pas de lien : l'écran est un rappel, et côté instructeur la fiche
              appartient à la déposante — le lien mènerait à un refus. */}
          <span>
            {fiche.titre || appLabels.demarchePlanContenuFicheSansTitre}
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
  plan: PlanContenuAffiche;
  className?: string;
}) => {
  if (plan.fiches.length === 0 && plan.axes.length === 0) {
    return (
      <p className={cn('m-0 text-sm italic text-grey-6', className)}>
        {appLabels.demarchePlanContenuPlanVide}
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
            {axe.nom || appLabels.demarchePlanContenuAxeSansNom}
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
const titreDuPlan = (plan: PlanContenuAffiche) =>
  appLabels.demarchePlanContenuPlanTitre({
    nom: plan.nom || appLabels.demarchePlanContenuPlanSansNom,
    actions: appLabels.demarcheProgrammeNombreActions({
      count: plan.nbFiches,
    }),
  });

/** Encadrement d'un plan dans l'accordéon, quand il y en a plusieurs. */
const CARTE_PLAN = 'rounded-lg border border-grey-3 bg-white';

/**
 * Le programme d'actions d'une démarche, en lecture seule.
 *
 * Rien n'est cliquable — ni le plan, ni ses actions. Côté instructeur parce
 * qu'il n'a aucun droit sur les plans de la déposante et que tout lien mènerait
 * à un écran qui le refuserait ; côté déposante parce que l'écran est un rappel
 * du dossier transmis, et que le plan se modifie ailleurs.
 */
export const PlansContenu = ({
  plans,
  emptyTitle,
  dataTestPrefix,
}: {
  plans: PlanContenuAffiche[];
  emptyTitle: string;
  dataTestPrefix: string;
}) => {
  if (plans.length === 0) {
    return (
      <EmptyCard
        picto={({ className }) => <PictoAction className={className} />}
        title={emptyTitle}
      />
    );
  }

  // Un seul plan — le cas courant : le contenu s'affiche à nu, sans carte ni
  // accordéon. Rien à replier ni à choisir, il n'y a pas de chrome à justifier.
  const [premierPlan] = plans;

  if (plans.length === 1) {
    return (
      <div
        className="flex flex-col gap-2"
        data-test={`${dataTestPrefix}.plans`}
      >
        <p
          className="m-0 text-base font-bold text-primary-9"
          data-test={`${dataTestPrefix}.plan-${premierPlan.id}`}
        >
          {titreDuPlan(premierPlan)}
        </p>
        <PlanContenu plan={premierPlan} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-test={`${dataTestPrefix}.plans`}>
      {plans.map((plan, index) => (
        <Accordion
          key={plan.id}
          dataTest={`${dataTestPrefix}.plan-${plan.id}`}
          // Le premier est déplié : c'est celui qu'on vient lire, et un
          // accordéon entièrement replié n'apprend rien.
          initialState={index === 0}
          title={titreDuPlan(plan)}
          content={<PlanContenu plan={plan} className="px-8 pb-6" />}
          containerClassname={CARTE_PLAN}
        />
      ))}
    </div>
  );
};
