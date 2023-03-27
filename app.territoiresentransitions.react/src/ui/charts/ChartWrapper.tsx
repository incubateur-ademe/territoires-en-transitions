/**
 * Wrapper des graphs customs pour ajouter un titre et mettre en forme la carte
 *
 * @param title - (string - optionnel) titre à afficher
 * @param children - (React.ReactNode) composant du graphe à afficher
 * @param customClass - (string - optionnel) classes supplémentaires à ajouter au wrapper
 */

import {CSSProperties} from '@material-ui/core/styles/withStyles';

type ChartWrapperProps = {
  title?: string;
  children: React.ReactNode;
  customClass?: string;
  customStyle?: CSSProperties;
};

const ChartWrapper = ({
  title,
  children,
  customClass = '',
  customStyle,
}: ChartWrapperProps) => {
  return (
    <div
      className={`border border-gray-200 flex flex-col w-full h-96 ${
        title ? 'pt-6' : ''
      } ${customClass}`}
      style={customStyle}
    >
      {!!title && <div className="mb-auto font-bold px-6">{title}</div>}
      {children}
    </div>
  );
};

export default ChartWrapper;
