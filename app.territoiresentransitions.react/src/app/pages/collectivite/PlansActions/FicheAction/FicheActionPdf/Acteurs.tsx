import {
  Card,
  List,
  ListElement,
  Stack,
  Title,
} from 'ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';
import {
  CiblePicto,
  EluPicto,
  PartenairePicto,
  PersonnePilotePicto,
  ServicePilotePicto,
  StructurePilotePicto,
} from 'ui/export-pdf/assets/picto';

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
      <Stack gap={3} direction="row" className="items-start">
        <PersonnePilotePicto className="h-9 w-9 -mt-2" />
        <ListeActeurs
          titre="Personne pilote"
          liste={pilotes?.map((pilote) => pilote.nom!)}
        />
      </Stack>

      <Stack gap={3} direction="row" className="items-start">
        <ServicePilotePicto className="h-9 w-9 -mt-2" />
        <ListeActeurs
          titre="Direction ou service pilote"
          liste={services?.map((service) => service.nom!)}
        />
      </Stack>

      <Stack gap={3} direction="row" className="items-start">
        <StructurePilotePicto className="h-9 w-9 -mt-2" />
        <ListeActeurs
          titre="Structure pilote"
          liste={structures?.map((structure) => structure.nom!)}
        />
      </Stack>

      <Stack gap={3} direction="row" className="items-start">
        <EluPicto className="h-9 w-9 -mt-2" />
        <ListeActeurs
          titre="Élu·e référent·e"
          liste={referents?.map((referent) => referent.nom!)}
        />
      </Stack>

      <Stack gap={3} direction="row" className="items-start">
        <PartenairePicto className="h-9 w-9 -mt-2" />
        <ListeActeurs
          titre="Partenaires"
          liste={partenaires?.map((partenaire) => partenaire.nom!)}
        />
      </Stack>

      <Stack gap={3} direction="row" className="items-start">
        <CiblePicto className="h-9 w-9 -mt-2" />
        <ListeActeurs titre="Cibles" liste={cibles?.map((cible) => cible)} />
      </Stack>
    </Card>
  );
};

export default Acteurs;
