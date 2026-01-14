import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { useUser } from '@tet/api';

export const GenerateReportPending = () => {
  const { email } = useUser();
  return (
    <div className="flex flex-col items-center justify-center">
      <PictoDocument width="100" height="100" />

      <p className="mt-4 text-primary-9 font-bold text-center mb-0 text-base leading-6">
        Votre rapport est en cours de génération. Selon le nombre d'actions
        sélectionnées, cela pourrait prendre quelques minutes.
        <br />
        Le téléchargement sera automatiquement déclenché une fois le rapport
        généré. Un email vous sera également envoyé à l'adresse email:{' '}
        <span className="text-info-1">{email}</span>.
      </p>
    </div>
  );
};
