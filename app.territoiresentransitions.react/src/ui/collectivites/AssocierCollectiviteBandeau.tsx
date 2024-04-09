import {getRejoindreCollectivitePath} from '@tet/api';
import {Alert, Button} from '@tet/ui';

const AssocierCollectiviteBandeau = () => {
  return (
    <Alert
      classname="px-0 lg:px-8"
      state="info"
      title="Pour accéder à plus de détails sur chacune des collectivités
      engagées dans le programme, vous devez être membre d’au moins une
      collectivité."
      footer={
        <Button
          data-test="btn-AssocierCollectivite"
          href={getRejoindreCollectivitePath(
            document.location.hostname,
            document.location.origin
          )}
        >
          Rejoindre une collectivité
        </Button>
      }
    />
  );
};

export default AssocierCollectiviteBandeau;
