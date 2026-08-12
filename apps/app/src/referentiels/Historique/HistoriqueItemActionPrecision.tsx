import { appLabels } from '@/app/labels/catalog';
import { RichTextEditor } from '@tet/ui';
import classNames from 'classnames';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from './DetailModificationWrapper';
import Modification from './Modification';
import { HistoriqueItemPropsOf } from './types';
import { getItemActionProps } from './utils';

type Props = HistoriqueItemPropsOf<'action_precision'>;

const HistoriqueItemActionPrecision = (props: Props) => {
  const { item } = props;

  return (
    <Modification
      historique={item}
      nom="Mesure : texte modifié"
      detail={
        <>
          {item.previousPrecision ? (
            <DetailPrecedenteModificationWrapper>
              {renderPrecision(item.previousPrecision, true)}
            </DetailPrecedenteModificationWrapper>
          ) : null}
          {item.precision && (
            <DetailNouvelleModificationWrapper>
              {renderPrecision(item.precision)}
            </DetailNouvelleModificationWrapper>
          )}
        </>
      }
      {...getItemActionProps(item)}
    />
  );
};

export default HistoriqueItemActionPrecision;

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
      <i>{appLabels.nonRenseigne}</i>
    )}
  </span>
);
