import { overmind, useAppState } from "core-logic/overmind";
import type { ActionReferentielScoreInterface } from "generated/models/action_referentiel_score";
import { ActionReferentiel } from "generated/models/action_referentiel";
import { useEffect, useState } from "react";

type ProgressState = "nc" | "alert" | "warning" | "ok" | "good" | "best";

const inferStateFromScore = (
  score?: ActionReferentielScoreInterface,
): ProgressState => {
  const percentage: number = score ? score.percentage * 100 : 0;
  if (score && score.avancement.includes("non_concernee")) {
    return "nc";
  } else if (percentage < 34) {
    return "alert";
  } else if (percentage < 49) {
    return "warning";
  } else if (percentage < 64) {
    return "ok";
  } else if (percentage < 74) {
    return "good";
  } else {
    return "best";
  }
};

const ProgressStatText = ({
  score,
}: {
  score?: ActionReferentielScoreInterface;
}) => {
  const percentageText = score
    ? `${(score.percentage * 100).toFixed(1)}% `
    : "0% ";
  const pointsRatioText = score
    ? `(${score.points.toFixed(2)}/${score.potentiel.toFixed(2)})`
    : "(../..)";

  if (score?.avancement === "non_concernee") {
    return <span className="text-progress-nc"> non concernée</span>;
  }
  return (
    <>
      <strong className="font-bold">{percentageText}</strong>
      {pointsRatioText}
    </>
  );
};

export const ProgressStat = ({
  action,
  position,
  className,
}: {
  action: ActionReferentiel;
  position: "left" | "right";
  className?: string;
}) => {
  const actionId = action.id;

  const score = useAppState().actionReferentielScoresById[actionId];
  useEffect(() => {
    const state = inferStateFromScore(score);
    setState(state);
  }, [score]);

  const [state, setState] = useState<ProgressState>("nc");

  const positionDependentStyle =
    position === "left"
      ? "bl-8 pl-3 border-l-8"
      : "bl-0 br-8 pl-2 pr-3 border-r-8";

  return (
    <div
      className={`py-1 text-base font-normal bg-white border-progress-${state} bg-y ${
        className ? className : ""
      } ${positionDependentStyle}`}
    >
      <ProgressStatText score={score} />
    </div>
  );
};
