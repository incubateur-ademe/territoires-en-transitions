import {EtoilesLabel} from 'app/types';
import LogoCAE from './LogoCAE';
import LogoCaeEci from './LogoCaeEci';
import LogoECI from './LogoECI';

type CodingPictoProps = {
  cae?: EtoilesLabel;
  eci?: EtoilesLabel;
  className?: string;
};

const LabellisationLogo = ({cae, eci, className}: CodingPictoProps) =>
  cae && eci ? (
    <LogoCaeEci cae={cae} eci={eci} className={className} />
  ) : cae ? (
    <LogoCAE cae={cae} className={className} />
  ) : eci ? (
    <LogoECI eci={eci} className={className} />
  ) : null;

export default LabellisationLogo;
