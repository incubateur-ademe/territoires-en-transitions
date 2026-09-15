import { Alert, Button } from '@tet/ui';

export const UserCollectivitesError = ({
  retry,
}: {
  retry: () => void;
}): React.ReactNode => (
  <div role="alert" className="w-full">
    <Alert
      state="error"
      title="Vos collectivités n'ont pas pu être chargées"
      description="Une erreur est survenue."
      footer={
        <Button size="sm" variant="outlined" onClick={retry}>
          Réessayer
        </Button>
      }
    />
  </div>
);
