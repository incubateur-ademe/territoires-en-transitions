import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { overmind } from "core-logic/overmind";
import { renderLoader } from "app/utils/renderLoader";

function lazyImport<
  T extends React.ComponentType<any>,
  I extends { [K2 in K]: T },
  K extends keyof I,
>(factory: () => Promise<I>, name: K): I {
  return Object.create({
    [name]: lazy(() => factory().then((module) => ({ default: module[name] }))),
  });
}

// Usage
const { ActionReferentiel } = lazyImport(
  () => import("./ActionReferentiel"),
  "ActionReferentiel",
);

export const ActionReferentielPage = () => {
  const { epciId, actionId } =
    useParams<{ epciId: string; actionId: string }>();
  console.log(actionId, epciId);

  overmind.actions.setCurrentEpci(epciId);

  return (
    <Suspense fallback={renderLoader()}>
      <ActionReferentiel />
    </Suspense>
  );
};
