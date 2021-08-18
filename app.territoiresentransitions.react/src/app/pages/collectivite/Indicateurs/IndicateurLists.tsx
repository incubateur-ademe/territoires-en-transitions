import React from 'react';
import {IndicateurPersonnaliseList} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseList';
import {IndicateurReferentielList} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielList';

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
