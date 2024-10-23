import Card from 'ui/exportPdf/components/Card';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

type ListeActeursProps = {
  titre: string;
  liste: string[] | undefined;
  className?: string;
};

const ListeActeurs = ({ titre, liste, className }: ListeActeursProps) => {
  return (
    <div style={className ? twToCss(className) : {}}>
      <h6 style={twToCss('text-xs text-primary-9 uppercase mt-0 mb-2')}>
        {titre}
      </h6>
      <ul style={twToCss('text-sm my-0')}>
        {liste && liste.length ? (
          liste.map((elt, index) => (
            <li
              key={`${elt}-${index}`}
              style={twToCss('text-xs text-primary-10 mb-1 -ml-6')}
            >
              {elt}
            </li>
          ))
        ) : (
          <li style={twToCss('text-xs text-grey-7 mb-1 -ml-6')}>
            Non renseigné
          </li>
        )}
      </ul>
    </div>
  );
};

const Acteurs = ({ fiche }: FicheActionPdfProps) => {
  const { pilotes, services, structures, referents, partenaires, cibles } =
    fiche;

  return (
    <Card className="w-2/5 ml-2 mb-4">
      <ListeActeurs
        titre="Personne pilote"
        liste={pilotes?.map((pilote) => pilote.nom!)}
        className="mb-4"
      />
      <ListeActeurs
        titre="Direction ou service pilote"
        liste={services?.map((service) => service.nom!)}
        className="mb-4"
      />
      <ListeActeurs
        titre="Structure pilote"
        liste={structures?.map((structure) => structure.nom!)}
        className="mb-4"
      />
      <ListeActeurs
        titre="Élu·e référent·e"
        liste={referents?.map((referent) => referent.nom!)}
        className="mb-4"
      />
      <ListeActeurs
        titre="Partenaires"
        liste={partenaires?.map((partenaire) => partenaire.nom!)}
        className="mb-4"
      />
      <ListeActeurs titre="Cibles" liste={cibles?.map((cible) => cible)} />
    </Card>
  );
};

export default Acteurs;
