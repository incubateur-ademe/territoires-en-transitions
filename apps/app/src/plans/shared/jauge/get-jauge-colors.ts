import { JAUGE_MAX } from '@tet/domain/plans';
import { preset } from '@tet/ui';

const { grey, primary, success } = preset.theme.extend.colors;

export type JaugeColors = {
  fill: string;
  track: string;
};

export const getJaugeColors = ({
  jauge,
  isDisabled,
}: {
  jauge: number;
  isDisabled: boolean;
}): JaugeColors => {
  if (isDisabled) {
    return { fill: grey[5], track: primary[2] };
  }
  if (jauge === JAUGE_MAX) {
    return { fill: success[1], track: primary[2] };
  }
  return { fill: primary[9], track: primary[2] };
};
