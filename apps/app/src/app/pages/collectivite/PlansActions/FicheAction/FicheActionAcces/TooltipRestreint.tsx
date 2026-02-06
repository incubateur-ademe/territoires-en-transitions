import { Tooltip } from '@tet/ui';
import { JSX } from 'react';

type TooltipRestreintProps = {
  children: JSX.Element;
  isRestreint: boolean;
};

const TooltipRestreint = ({ children, isRestreint }: TooltipRestreintProps) => {
  return isRestreint ? (
    <Tooltip
      label={
        <p className="w-96">
          Si le mode privé est activé, l&apos;action n&apos;est plus consultable
          par les personnes n’étant pas membres de votre collectivité.
          <br />
          <br />
          L&apos;action reste consultable par l&apos;ADEME et le service support
          de la plateforme.
        </p>
      }
    >
      {children}
    </Tooltip>
  ) : (
    children
  );
};

export default TooltipRestreint;
