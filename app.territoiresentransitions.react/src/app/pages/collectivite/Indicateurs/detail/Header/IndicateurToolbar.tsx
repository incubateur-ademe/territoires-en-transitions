import { Button } from '@/ui';
import classNames from 'classnames';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';
import { TIndicateurDefinition } from '../../types';
import DeleteModal from './DeleteModal';
import EditModal from './EditModal';

type Props = {
  definition: TIndicateurDefinition;
  collectiviteId: number;
  isPerso?: boolean;
  isReadonly?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
  collectiviteId,
  isPerso = false,
  isReadonly = false,
  className,
}: Props) => {
  const { mutate: exportIndicateurs, isLoading } = useExportIndicateurs(
    isPerso ? 'app/indicateurs/perso' : 'app/indicateurs/predefini',
    [definition]
  );

  return (
    <>
      <div className={classNames('flex gap-4 lg:mt-3.5', className)}>
        {!isReadonly && (
          <EditModal {...{ collectiviteId, definition, isLoading }} />
        )}

        <Button
          loading={isLoading}
          disabled={isLoading}
          icon="download-fill"
          title="Exporter au format .xlsx"
          size="xs"
          variant="grey"
          onClick={() => exportIndicateurs()}
        />

        {!isReadonly && isPerso && (
          <DeleteModal {...{ definition, isLoading }} />
        )}

        {/* TODO : déplacer les infos dans l'onglet dédié */}
        {/* {!isPerso && <IndicateurSidePanelToolbar definition={definition} />} */}
      </div>
    </>
  );
};

export default IndicateurToolbar;
