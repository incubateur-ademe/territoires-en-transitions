import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';

type IndicateursTabProps = {
  indicateurs: Indicateur[] | null;
};

const IndicateursTab = ({indicateurs}: IndicateursTabProps) => {
  const isEmpty = indicateurs === null || indicateurs.length === 0;

  return isEmpty ? (
    <div>Aucun indicateur associé !</div>
  ) : (
    <div>Indicateurs</div>
  );
};

export default IndicateursTab;
