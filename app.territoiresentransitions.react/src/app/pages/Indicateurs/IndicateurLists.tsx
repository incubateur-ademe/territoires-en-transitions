import React from 'react';
import {IndicateurPersonnaliseList} from "./IndicateurPersonnaliseList";
import {IndicateurReferentielList} from "./IndicateurReferentielList";

/**
 * IndicateursList show both indicateurs personnalisés and indicateurs référentiel.
 */
const IndicateurLists = () => {
    return (
        <div>
            <IndicateurPersonnaliseList/>
            <IndicateurReferentielList/>
        </div>
    );
};

export default IndicateurLists;

