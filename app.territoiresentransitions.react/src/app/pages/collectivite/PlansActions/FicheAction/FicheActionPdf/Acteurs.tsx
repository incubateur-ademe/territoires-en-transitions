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
  picto: (className: string) => React.ReactNode;
};

const ListeActeurs = ({ titre, liste, picto }: ListeActeursProps) => {
  return (
    <Stack wrap={false} gap={0}>
      <Stack gap={3} direction="row" className="items-center">
        {picto('h-9 w-9 shrink-0')}
        <Title variant="h6" className="uppercase">
          {titre}
        </Title>
      </Stack>

      <List className="pl-12 pr-5">
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
        picto={(className) => <PersonnePilotePicto className={className} />}
      />

      <ListeActeurs
        titre="Direction ou service pilote"
        liste={services?.map((service) => service.nom!)}
        picto={(className) => <ServicePilotePicto className={className} />}
      />

      <ListeActeurs
        titre="Structure pilote"
        liste={structures?.map((structure) => structure.nom!)}
        picto={(className) => <StructurePilotePicto className={className} />}
      />

      <ListeActeurs
        titre="Élu·e référent·e"
        liste={referents?.map((referent) => referent.nom!)}
        picto={(className) => <EluPicto className={className} />}
      />

      <ListeActeurs
        titre="Partenaires"
        liste={partenaires?.map((partenaire) => partenaire.nom!)}
        picto={(className) => <PartenairePicto className={className} />}
      />

      <ListeActeurs
        titre="Cibles"
        liste={cibles?.map((cible) => cible)}
        picto={(className) => <CiblePicto className={className} />}
      />
    </Card>
  );
};

export default Acteurs;
