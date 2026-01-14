import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { useUser } from '@tet/api';

export const GenerateReportPending = () => {
  const { email } = useUser();
  return (
    <div className="flex flex-col items-center justify-center">
      <PictoDocument width="100" height="100" />

      <p className="mt-4 text-primary-9 font-bold text-center mb-0 text-base leading-6">
        Votre rapport est en cours de génération. Le traitement peut prendre quelques minutes selon le volume de données.
        <br />
        Vous recevrez un email à <span className="text-info-1">{email}</span>. avec un lien pour télécharger votre rapport dès qu'il sera prêt.
      </p>
    </div>
  );
};
