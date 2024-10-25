import classNames from 'classnames';
import { Card, Paragraph, Title } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Indicateurs = ({ fiche }: FicheActionPdfProps) => {
  const { objectifs, resultatsAttendus: effetsAttendus } = fiche;

  const emptyObjectifs = !objectifs || objectifs.length === 0;
  const emptyEffetsAttendus = !effetsAttendus || effetsAttendus.length === 0;

  if (emptyObjectifs && emptyEffetsAttendus) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Indicateurs de suivi
      </Title>

      {/* Objectifs */}
      <Paragraph
        className={classNames({
          'text-grey-7': emptyObjectifs,
        })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Objectifs :{' '}
        </Paragraph>
        {!emptyObjectifs ? objectifs : 'Non renseignés'}
      </Paragraph>

      {/* Effets attendus */}
      <Paragraph
        className={classNames({
          'text-grey-7': emptyEffetsAttendus,
        })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Effets attendus :{' '}
        </Paragraph>
        {!emptyEffetsAttendus
          ? effetsAttendus.map((res) => res.nom).join(', ')
          : 'Non renseignés'}
      </Paragraph>
    </Card>
  );
};

export default Indicateurs;
