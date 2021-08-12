import React, { lazy, Suspense } from "react";
import { renderLoader } from "../../utils/renderLoader";

const Referentiels = lazy(() => import("./Referentiels"));

export const ReferentielsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Referentiels />
    </Suspense>
  );
};
