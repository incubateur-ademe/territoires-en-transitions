import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import classNames from 'classnames';
import { getItemActionProps } from '../actionStatut/getItemActionProps';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '../DetailModificationWrapper';
import { THistoriqueItemProps } from '../types';

const HistoriqueItemActionPrecision = (props: THistoriqueItemProps) => {
  const { item } = props;

  return (
    <Modification
      historique={item}
      nom="Action : texte modifié"
      detail={<HistoriqueItemActionPrecisionDetails item={item} />}
      {...getItemActionProps(item)}
    />
  );
};

export default HistoriqueItemActionPrecision;

const HistoriqueItemActionPrecisionDetails = (props: THistoriqueItemProps) => {
  const { item } = props;
  const { previous_precision, precision } = item;

  return (
    <>
      {previous_precision ? (
        <DetailPrecedenteModificationWrapper>
          {renderPrecision(previous_precision!, true)}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {renderPrecision(precision!)}
      </DetailNouvelleModificationWrapper>
    </>
  );
};

const renderPrecision = (value: string, isPrevious?: boolean) => (
  <span
    className={classNames('whitespace-pre-line', {
      'line-through': isPrevious,
    })}
  >
    {typeof value === 'string' && value.trim() !== '' ? (
      value
    ) : (
      <i>Non renseigné</i>
    )}
  </span>
);
