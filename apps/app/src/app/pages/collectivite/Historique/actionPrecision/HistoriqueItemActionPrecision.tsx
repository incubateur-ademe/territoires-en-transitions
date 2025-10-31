import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import { RichTextEditor } from '@/ui';
import classNames from 'classnames';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '../DetailModificationWrapper';
import { getItemActionProps } from '../actionStatut/getItemActionProps';
import { THistoriqueItemProps } from '../types';

const HistoriqueItemActionPrecision = (props: THistoriqueItemProps) => {
  const { item } = props;

  return (
    <Modification
      historique={item}
      nom="Mesure : texte modifié"
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
          {renderPrecision(previous_precision, true)}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      {precision && (
        <DetailNouvelleModificationWrapper>
          {renderPrecision(precision)}
        </DetailNouvelleModificationWrapper>
      )}
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
      <RichTextEditor
        disabled
        initialValue={value}
        className="!bg-transparent border-none !px-2 py-0"
      />
    ) : (
      <i>Non renseigné</i>
    )}
  </span>
);
