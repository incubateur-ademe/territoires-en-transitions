import {
  CiblePicto,
  CitoyenPicto,
  EluPicto,
  PartenairePicto,
  ServicePilotePicto,
  StructurePilotePicto,
} from '@/app/ui/export-pdf/assets/picto';
import {
  Card,
  List,
  ListElement,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { getOptionLabel } from '@/ui';
import { ficheActionParticipationOptions } from '../../../../../../ui/dropdownLists/listesStatiques';
import { FicheActionPdfProps } from './FicheActionPdf';

type ListeActeursProps = {
  titre: string;
  liste: string[] | undefined;
  comment?: string;
  picto: (className: string) => React.ReactNode;
};

const ListeActeurs = ({ titre, liste, comment, picto }: ListeActeursProps) => {
  return (
    <Stack wrap={false} gap={0}>
      <Stack gap={3} direction="row" className="items-center">
        {picto('h-9 w-9 shrink-0')}
        <Title variant="h6" className="uppercase">
          {titre}
        </Title>
      </Stack>

      <Stack gap="px" className="pl-12 pr-5">
        {((liste && liste.length) || !comment) && (
          <List>
            {liste && liste.length ? (
              liste.map((elt, index) => (
                <ListElement key={`${elt}-${index}`}>{elt}</ListElement>
              ))
            ) : (
              <ListElement className="text-grey-7">Non renseigné</ListElement>
            )}
          </List>
        )}
        {comment && <Paragraph>{comment}</Paragraph>}
      </Stack>
    </Stack>
  );
};

const Acteurs = ({ fiche }: FicheActionPdfProps) => {
  const {
    services,
    structures,
    referents,
    partenaires,
    cibles,
    participationCitoyenneType,
    participationCitoyenne,
  } = fiche;

  return (
    <Card wrap={false} direction="row">
      <Stack className="w-[49%]">
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
      </Stack>

      <Stack className="w-[49%]">
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
        <ListeActeurs
          titre="Participation citoyenne"
          liste={
            participationCitoyenneType
              ? [
                  getOptionLabel(
                    participationCitoyenneType,
                    ficheActionParticipationOptions
                  ) as string,
                ]
              : undefined
          }
          comment={participationCitoyenne ?? undefined}
          picto={(className) => <CitoyenPicto className={className} />}
        />
      </Stack>
    </Card>
  );
};

export default Acteurs;
