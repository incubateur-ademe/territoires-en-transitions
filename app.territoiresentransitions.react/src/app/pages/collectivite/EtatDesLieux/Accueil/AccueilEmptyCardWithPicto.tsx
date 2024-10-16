import AccueilCard from './AccueilCard';

type AccueilEmptyCardWithPictoProps = {
  children: React.ReactNode;
  picto: React.ReactNode;
};

/**
 * Carte vide de la page d'accueil
 */

const AccueilEmptyCardWithPicto = ({
  children,
  picto,
}: AccueilEmptyCardWithPictoProps): JSX.Element => {
  return (
    <AccueilCard className="grow grid md:grid-cols-3 gap-8">
      <div className="m-auto">{picto}</div>
      <div className="md:col-span-2 flex flex-col justify-end">{children}</div>
    </AccueilCard>
  );
};

export default AccueilEmptyCardWithPicto;
