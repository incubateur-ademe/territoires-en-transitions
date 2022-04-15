import {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {ReferentielOfIndicateur} from 'types/litterals';
import Thematiques from './Thematiques';
import {useQuestionThematiqueCompletude} from './useQuestionThematiqueCompletude';

export default observer(() => {
  const collectivite = currentCollectiviteBloc.currentCollectivite;
  const {collectivite_id, nom} = collectivite || {};
  const [selected, setSelected] = useState<ReferentielOfIndicateur[]>([
    'eci',
    'cae',
  ]);
  const thematiques = useQuestionThematiqueCompletude(
    collectivite_id || 0,
    selected
  );

  if (!collectivite_id) {
    return null;
  }

  return (
    <main className="fr-container mt-9 mb-16">
      <Thematiques
        collectivite={{id: collectivite_id, nom: nom || ''}}
        selected={selected}
        onChange={setSelected}
        items={thematiques}
      />
    </main>
  );
});
