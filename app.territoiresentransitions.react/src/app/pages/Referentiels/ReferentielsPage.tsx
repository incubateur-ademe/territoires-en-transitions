import { useReferentielState } from "core-logic/overmind/hooks";
import { lazy, Suspense } from "react";
import { renderLoader } from "utils/renderLoader";

const Referentiels = lazy(() => import("./Referentiels"));

export const ReferentielsPage = () => {
  useReferentielState();

  return (
    <Suspense fallback={renderLoader()}>
      <Referentiels />
    </Suspense>
  );
};
