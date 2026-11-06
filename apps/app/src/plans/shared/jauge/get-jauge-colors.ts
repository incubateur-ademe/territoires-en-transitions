import { ColorVariant } from '@tet/design-tokens';
import { JAUGE_MAX } from '@tet/domain/plans';
import { preset } from '@tet/ui';

const { grey, primary, success } = preset.theme.extend.colors;

export type JaugeColors = {
  badgeVariant: ColorVariant;
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
    return { badgeVariant: 'grey', fill: grey[5], track: grey[3] };
  }
  if (jauge === JAUGE_MAX) {
    return { badgeVariant: 'success', fill: success[1], track: success[1] };
  }
  return { badgeVariant: 'info', fill: primary.DEFAULT, track: primary[3] };
};
