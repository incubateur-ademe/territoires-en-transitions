import {getRejoindreCollectivitePath} from '@tet/api';
import {Alert, Button} from '@tet/ui';

const AssocierCollectiviteBandeau = () => {
  return (
    <Alert
      fullPageWidth
      state="info"
      title="Pour accéder à plus de détails sur chacune des collectivités
      engagées dans le programme, vous devez être membre d’au moins une
      collectivité."
      footer={
        <Button
          data-test="btn-AssocierCollectivite"
          size="sm"
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
