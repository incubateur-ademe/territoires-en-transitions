/**
 * Wrapper des graphs customs pour ajouter un titre et mettre en forme la carte
 *
 * @param title - (string - optionnel) titre à afficher
 * @param children - (React.ReactNode) composant du graphe à afficher
 * @param customClass - (string - optionnel) classes supplémentaires à ajouter au wrapper
 */

type ChartWrapperProps = {
  title?: string;
  children: React.ReactNode;
  customClass?: string;
};

const ChartWrapper = ({
  title,
  children,
  customClass = '',
}: ChartWrapperProps) => {
  return (
    <div
      className={`border border-gray-200 flex flex-col  w-full pt-6 ${customClass}`}
      style={{
        height: '350px',
      }}
    >
      {!!title && <div className="mb-auto font-bold px-6">{title}</div>}
      {children}
    </div>
  );
};

export default ChartWrapper;
