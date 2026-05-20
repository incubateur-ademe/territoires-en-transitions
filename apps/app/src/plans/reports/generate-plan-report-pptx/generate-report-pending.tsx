import { appLabels } from '@/app/labels/catalog';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { useUser } from '@tet/api';

export const GenerateReportPending = () => {
  const { email } = useUser();
  return (
    <div className="flex flex-col items-center justify-center">
      <PictoDocument width="100" height="100" />

      <p className="mt-4 text-primary-9 font-bold text-center mb-0 text-base leading-6">
        {appLabels.rapportGenerationEnCoursIntro}
        <br />
        {appLabels.vousRecevrezEmailA}
        <span className="text-info-1">{email}</span>
        {appLabels.avecLienTelechargerRapport}
      </p>
    </div>
  );
};
