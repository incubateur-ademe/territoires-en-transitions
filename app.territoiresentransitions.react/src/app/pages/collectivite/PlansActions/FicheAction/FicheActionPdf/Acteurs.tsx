import { Card, List, ListElement, Stack, Title } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

type ListeActeursProps = {
  titre: string;
  liste: string[] | undefined;
};

const ListeActeurs = ({ titre, liste }: ListeActeursProps) => {
  return (
    <Stack gap={2}>
      <Title variant="h6" className="uppercase">
        {titre}
      </Title>
      <List>
        {liste && liste.length ? (
          liste.map((elt, index) => (
            <ListElement key={`${elt}-${index}`}>{elt}</ListElement>
          ))
        ) : (
          <ListElement className="text-grey-7">Non renseigné</ListElement>
        )}
      </List>
    </Stack>
  );
};

const Acteurs = ({ fiche }: FicheActionPdfProps) => {
  const { pilotes, services, structures, referents, partenaires, cibles } =
    fiche;

  return (
    <Card className="w-2/5">
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
    </Card>
  );
};

export default Acteurs;
