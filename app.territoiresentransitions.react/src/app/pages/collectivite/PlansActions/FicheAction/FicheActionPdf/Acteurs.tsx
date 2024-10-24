import Card from 'ui/exportPdf/components/Card';
import Stack from 'ui/exportPdf/components/Stack';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

type ListeActeursProps = {
  titre: string;
  liste: string[] | undefined;
};

const ListeActeurs = ({ titre, liste }: ListeActeursProps) => {
  return (
    <Stack gap={2}>
      <h6 style={twToCss('text-xs text-primary-9 uppercase my-0')}>{titre}</h6>
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
    </Stack>
  );
};

const Acteurs = ({ fiche }: FicheActionPdfProps) => {
  const { pilotes, services, structures, referents, partenaires, cibles } =
    fiche;

  return (
    <Card className="w-2/5 ml-2">
      <Stack>
        <ListeActeurs
          titre="Personne pilote"
          liste={pilotes?.map((pilote) => pilote.nom!)}
        />
        <ListeActeurs
          titre="Direction ou service pilote"
          liste={services?.map((service) => service.nom!)}
        />
        <ListeActeurs
          titre="Structure pilote"
          liste={structures?.map((structure) => structure.nom!)}
        />
        <ListeActeurs
          titre="Élu·e référent·e"
          liste={referents?.map((referent) => referent.nom!)}
        />
        <ListeActeurs
          titre="Partenaires"
          liste={partenaires?.map((partenaire) => partenaire.nom!)}
        />
        <ListeActeurs titre="Cibles" liste={cibles?.map((cible) => cible)} />
      </Stack>
    </Card>
  );
};

export default Acteurs;
