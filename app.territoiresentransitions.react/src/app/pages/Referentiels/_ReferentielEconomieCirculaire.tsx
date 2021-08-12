import type { ActionReferentiel } from "generated/models/action_referentiel";
import { ProgressStat } from "ui/referentiels/ProgressStat";

export const EciAxisSection = ({ axis }: { axis: ActionReferentiel }) => (
  <div>
    <h2 className="fr-h2">
      {axis.id_nomenclature} {axis.nom}
    </h2>
    <ProgressStat action={axis} position="left" className="w-full" />
    <div className="h-16" />
    {axis.actions.map((action) => (
      <ActionReferentielTitleCard
        action={action}
        referentielName="Économie circulaire"
      />
    ))}
  </div>
);

// font-size: 1.25rem;
// line-height: 1.33;

const ActionReferentielTitle = ({ action }: { action: ActionReferentiel }) => (
  <span className="text-lg h-8">
    {action.id_nomenclature} - {action.nom}
  </span>
);

export const ActionReferentielTitleCard = ({
  action,
  referentielName,
}: {
  action: ActionReferentiel;
  referentielName: string;
}) => (
  <article className="bg-beige my-4">
    <div className="flex p-4 justify-between">
      <div>
        <span className="inline-block text-xs font-thin">
          {referentielName}
        </span>
      </div>
      <ProgressStat action={action} position="right" className="w-100" />
    </div>
    <div className="p-4">
      <ActionReferentielTitle action={action} />
    </div>
    <div></div>
  </article>
);

export const ActionsEconomieCirculaire = ({
  actions,
}: {
  actions: ActionReferentiel[];
}) => {
  const eciReferentiel = actions.find(
    (action) => action.id === "economie_circulaire",
  );
  const eciAxes = eciReferentiel ? eciReferentiel.actions : [];

  return (
    <section>
      {eciAxes.map((axis) => (
        <EciAxisSection axis={axis} />
      ))}
    </section>
  );
};

type ActionGenericDescriptionProps = { description: string };

const ActionGenericDescription = ({
  description,
}: ActionGenericDescriptionProps) => {
  if (description) return;
};

type ActionReferentielCardProps = { action: ActionReferentiel };

const ActionReferentielCard = ({ action }: ActionReferentielCardProps) => {
  if (action.actions.length === 0)
    return (
      <article className="bg-yellow-50">
        <h3>
          <span>{action.id_nomenclature} - </span>
          {action.nom}
        </h3>
        <h4> Description </h4>
        <div
          dangerouslySetInnerHTML={{
            __html: action.description,
          }}
        ></div>
      </article>
    );
  else
    return (
      <div>
        {" "}
        {action.actions.map((action) => (
          <ActionReferentielCard action={action} />
        ))}
      </div>
    );
};
