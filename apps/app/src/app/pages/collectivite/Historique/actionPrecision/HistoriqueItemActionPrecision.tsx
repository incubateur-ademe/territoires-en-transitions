import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import { RichTextEditor } from '@tet/ui';
import classNames from 'classnames';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '../DetailModificationWrapper';
import { getItemActionProps } from '../actionStatut/getItemActionProps';
import { HistoriqueItemPropsOf } from '../types';

type Props = HistoriqueItemPropsOf<'action_precision'>;

const HistoriqueItemActionPrecision = (props: Props) => {
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

const HistoriqueItemActionPrecisionDetails = (props: Props) => {
  const { item } = props;
  const { previousPrecision, precision } = item;

  return (
    <>
      {previousPrecision ? (
        <DetailPrecedenteModificationWrapper>
          {renderPrecision(previousPrecision, true)}
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
