import {useState} from 'react';
import classNames from 'classnames';
import {Badge, Button} from '@tet/ui';
import {FicheAction} from '../data/types';
import ModaleIndicateursHeader from './ModaleIndicateursHeader';
import {getTruncatedText} from '../utils';

type IndicateursHeaderProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursHeader = ({
  isReadonly,
  fiche,
  updateFiche,
}: IndicateursHeaderProps) => {
  const [isFullObjectifs, setIsFullObjectifs] = useState(false);

  const {objectifs, resultats_attendus: resultats} = fiche;

  const {
    truncatedText: truncatedObjectifs,
    isTextTruncated: isObjectifsTruncated,
  } = getTruncatedText(objectifs, 1000);

  return (
    <>
      {/* Titre et bouton d'édition */}
      <div className="flex justify-between">
        <h5 className="text-primary-8 mb-0">Indicateurs de suivi</h5>
        {!isReadonly && (
          <ModaleIndicateursHeader fiche={fiche} updateFiche={updateFiche} />
        )}
      </div>

      {/* Objectifs */}
      <div>
        <span className="uppercase text-primary-9 text-sm font-bold leading-6 mr-3">
          Objectifs :
        </span>
        <span
          className={classNames('text-sm leading-6 whitespace-pre-wrap', {
            'text-primary-10': objectifs && objectifs.length,
            'text-grey-7': !objectifs || !objectifs.length,
          })}
        >
          {objectifs && objectifs?.length
            ? isFullObjectifs || !isObjectifsTruncated
              ? objectifs
              : truncatedObjectifs
            : 'Non renseignés'}
        </span>
        {isObjectifsTruncated && (
          <Button
            variant="underlined"
            size="xs"
            className="ml-auto"
            onClick={() => setIsFullObjectifs(prevState => !prevState)}
          >
            {isFullObjectifs ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>

      {/* Effets attendus */}
      <div className="flex gap-x-3 gap-y-2 flex-wrap">
        <span className="uppercase text-primary-9 text-sm font-bold leading-7">
          Effets attendus :
        </span>
        {resultats && resultats.length ? (
          resultats.map(res => (
            <Badge key={res} title={res} state="standard" uppercase={false} />
          ))
        ) : (
          <span className="text-sm text-grey-7 leading-7">Non renseignés</span>
        )}
      </div>
    </>
  );
};

export default IndicateursHeader;
