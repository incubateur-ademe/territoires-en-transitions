import {FicheAction} from 'generated/models/fiche_action';
import {useAllFiches} from 'core-logic/hooks/fiches';
import {Link} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks/params';

type FicheItemProps = {
  fiche: FicheAction;
};

const FicheItem = (props: FicheItemProps) => {
  const epciId = useEpciId();
  return (
    <div>
      <h3>{props.fiche.titre}</h3>
      <Link to={`/collectivite/${epciId}/fiche/${props.fiche.uid}`}>hop</Link>
    </div>
  );
};

const FichesList = () => {
  const fiches = useAllFiches();
  return (
    <section>
      <h2>Mes fiches</h2>
      {fiches.map(fiche => (
        <FicheItem fiche={fiche} key={fiche.id} />
      ))}
    </section>
  );
};

export default FichesList;
