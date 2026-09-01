export type TIdentifiantActionProps = {
  identifiant: string;
};

export const IdentifiantAction = (props: TIdentifiantActionProps) => {
  const { identifiant } = props;

  return (
    <span className="text-grey-8 text-sm font-medium">{`(${identifiant})`}</span>
  );
};
