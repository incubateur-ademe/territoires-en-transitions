import { useCurrentCollectivite } from '@tet/api/collectivites';
import CarteDocument from './CarteDocument';
import { TPreuve } from './types';

export type TPreuveDocProps = {
  classComment?: string;
  preuve: TPreuve;
  readonly?: boolean;
  displayIdentifier?: boolean;
};

const PreuveDoc = (props: TPreuveDocProps) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  return (
    <CarteDocument
      classComment={props.classComment}
      displayIdentifier={props.displayIdentifier}
      document={props.preuve}
      isReadonly={
        !hasCollectivitePermission('referentiels.mutate') ||
        props.readonly ||
        false
      }
    />
  );
};

export default PreuveDoc;
