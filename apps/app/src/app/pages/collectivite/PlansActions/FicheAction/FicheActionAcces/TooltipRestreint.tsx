import { Tooltip } from '@tet/ui';

type TooltipRestreintProps = {
  children: JSX.Element;
  isRestreint: boolean;
};

const TooltipRestreint = ({ children, isRestreint }: TooltipRestreintProps) => {
  return isRestreint ? (
    <Tooltip
      label={
        <p className="w-96">
          Si le mode privé est activé, l'action n&apos;est plus consultable par
          les personnes n’étant pas membres de votre collectivité.
          <br />
          <br />
          L'action reste consultable par l’ADEME et le service support de la
          plateforme.
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
