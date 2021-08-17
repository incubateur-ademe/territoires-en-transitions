import React from 'react';
import {IndicateurPersonnaliseList} from 'app/pages/Epci/Indicateurs/IndicateurPersonnaliseList';
import {IndicateurReferentielList} from 'app/pages/Epci/Indicateurs/IndicateurReferentielList';

/**
 * IndicateursList show both indicateurs personnalisés and indicateurs référentiel.
 */
const IndicateurLists = () => {
  return (
    <>
      <IndicateurPersonnaliseList />
      <IndicateurReferentielList />
    </>
  );
};

export default IndicateurLists;
