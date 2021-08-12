import React, {lazy, Suspense} from 'react';
import {renderLoader} from "../../utils/renderLoader";

const IndicateurReferentielList = lazy(() => import('./IndicateurReferentielList'));
const IndicateurPersonnaliseList = lazy(() => import('./IndicateurPersonnaliseList'));


/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {

    return (
        <Suspense fallback={renderLoader()}>
            <div className="my-5 flex flex-col">
                <h1 className="fr-h1">Indicateurs</h1>
                <IndicateurPersonnaliseList/>
                <IndicateurReferentielList/>
            </div>
        </Suspense>
    );
};


