import { EtoilesLabel } from '@/site/app/types';
import LabelReferentiel from './LabelReferentiel';
import LogoTeTe from './LogoTeTe';

type CodingPictoProps = {
  cae?: EtoilesLabel;
  eci?: EtoilesLabel;
  className?: string;
};

const LabellisationLogo = ({ cae, eci, className }: CodingPictoProps) => {
  if (!cae && !eci) return null;

  return (
    <div className={className}>
      <LogoTeTe />
      <div className="flex flex-col gap-4">
        {!!cae && <LabelReferentiel referentiel="cae" etoiles={cae} />}
        {!!eci && <LabelReferentiel referentiel="eci" etoiles={eci} />}
      </div>
    </div>
  );
};

export default LabellisationLogo;
