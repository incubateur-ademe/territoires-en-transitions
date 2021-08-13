import { Suspense } from "react";
import { useParams } from "react-router-dom";
import { overmind } from "core-logic/overmind";
import { lazyImport, renderLoader } from "utils";

const { ActionReferentielAvancement } = lazyImport(
  () => import("./ActionReferentielAvancement"),
  "ActionReferentielAvancement",
);

export const ActionReferentielAvancementPage = () => {
  const { epciId, actionId } =
    useParams<{ epciId: string; actionId: string }>();

  overmind.actions.setCurrentEpci(epciId);

  return (
    <Suspense fallback={renderLoader()}>
      <ActionReferentielAvancement actionId={actionId} />
    </Suspense>
  );
};
