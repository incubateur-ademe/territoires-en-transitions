export const Star = ({fill}: {fill: string}) => (
  <svg
    width="39"
    height="38"
    viewBox="0 0 39 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.5002 30.434L7.74518 37.014L10.3702 23.8006L0.478516 14.654L13.8569 13.0673L19.5002 0.833984L25.1435 13.0673L38.5219 14.654L28.6302 23.8006L31.2552 37.014L19.5002 30.434Z"
      fill={fill}
    />
  </svg>
);

export const GreyStar = () => <Star fill="#e5e5e5" />;
