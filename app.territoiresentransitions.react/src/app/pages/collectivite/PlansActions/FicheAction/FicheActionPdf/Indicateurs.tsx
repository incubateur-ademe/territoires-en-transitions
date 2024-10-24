import Card from 'ui/exportPdf/components/Card';
import Stack from 'ui/exportPdf/components/Stack';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const Indicateurs = ({ fiche }: FicheActionPdfProps) => {
  const { objectifs, resultatsAttendus: effetsAttendus } = fiche;

  if (!objectifs && (!effetsAttendus || effetsAttendus.length === 0))
    return null;

  return (
    <Card>
      <Stack>
        <h5 style={twToCss('my-0 text-primary-8 text-base')}>
          Indicateurs de suivi
        </h5>

        {/* Objectifs */}
        <div>
          <span
            style={twToCss(
              'text-xs text-primary-9 font-bold uppercase my-0 mr-1'
            )}
          >
            Objectifs :{' '}
          </span>
          <span
            style={twToCss(
              `text-xs leading-6 my-0 ${
                objectifs && objectifs.length
                  ? 'text-primary-10'
                  : 'text-grey-7'
              }`
            )}
          >
            {objectifs && objectifs?.length ? objectifs : 'Non renseignés'}
          </span>
        </div>

        {/* Effets attendus */}
        <div>
          <span
            style={twToCss(
              'text-xs text-primary-9 font-bold uppercase my-0 mr-1'
            )}
          >
            Effets attendus :{' '}
          </span>
          <span
            style={twToCss(
              `text-xs leading-6 my-0 ${
                effetsAttendus && effetsAttendus.length
                  ? 'text-primary-10'
                  : 'text-grey-7'
              }`
            )}
          >
            {effetsAttendus && effetsAttendus.length
              ? effetsAttendus.map((res) => res.nom).join(', ')
              : 'Non renseignés'}
          </span>
        </div>
      </Stack>
    </Card>
  );
};

export default Indicateurs;
