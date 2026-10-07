import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';

type DuplicatedDocumentAlertProps = {
  storedFilenameKept: boolean;
};

export const DuplicatedDocumentAlert = ({
  storedFilenameKept,
}: DuplicatedDocumentAlertProps) => (
  <Alert
    state="info"
    description={appLabels.fichierDupliqueCarteInfo({
      nomEnregistreConserve: storedFilenameKept,
    })}
  />
);