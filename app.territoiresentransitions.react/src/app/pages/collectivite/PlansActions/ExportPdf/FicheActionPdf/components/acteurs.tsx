import { FicheActionPdfProps } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/FicheActionPdf';
import { ficheActionParticipationOptions } from '@/app/ui/dropdownLists/listesStatiques';
import {
  BriefcaseIcon,
  Focus3Icon,
  GovernmentIcon,
  LeafIcon,
  ShieldUserIcon,
  UserCommunityIcon,
  UserIcon,
} from '@/app/ui/export-pdf/assets/icons';
import {
  Badge,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { getOptionLabel, preset } from '@/ui';

const { colors } = preset.theme.extend;

const Acteurs = ({ fiche }: FicheActionPdfProps) => {
  const {
    pilotes,
    services,
    structures,
    referents,
    partenaires,
    cibles,
    participationCitoyenneType,
    participationCitoyenne,
  } = fiche;

  const participationCitoyenneListe = participationCitoyenneType
    ? [
        getOptionLabel(
          participationCitoyenneType,
          ficheActionParticipationOptions
        ) as string,
      ]
    : undefined;

  if (
    !pilotes &&
    !services &&
    !structures &&
    !referents &&
    !partenaires &&
    !cibles &&
    !participationCitoyenneType &&
    !participationCitoyenne
  )
    return null;

  return (
    <Card gap={2}>
      <Title variant="h6" className="uppercase text-[0.7rem]">
        Acteurs du projet :
      </Title>

      {!!pilotes && pilotes.length > 0 && (
        <ActeursListe
          titre="Personnes Pilotes"
          liste={pilotes.map((p) => p.nom)}
          icon={(fill) => <UserIcon fill={fill} />}
        />
      )}

      {!!services && services.length > 0 && (
        <ActeursListe
          titre="Directions ou Services Pilotes"
          liste={services.map((s) => s.nom)}
          icon={(fill) => <LeafIcon fill={fill} />}
        />
      )}

      {!!structures && structures.length > 0 && (
        <ActeursListe
          titre="Structures Pilotess"
          liste={structures.map((s) => s.nom)}
          icon={(fill) => <BriefcaseIcon fill={fill} />}
        />
      )}

      {!!referents && referents.length > 0 && (
        <ActeursListe
          titre="Élus Référents"
          liste={referents.map((r) => r.nom)}
          icon={(fill) => <GovernmentIcon fill={fill} />}
        />
      )}

      {!!partenaires && partenaires.length > 0 && (
        <ActeursListe
          titre="Partenaires"
          liste={partenaires.map((p) => p.nom)}
          icon={(fill) => <ShieldUserIcon fill={fill} />}
        />
      )}

      {!!cibles && cibles.length > 0 && (
        <ActeursListe
          titre="Cibles"
          liste={cibles.map((c) => c)}
          icon={(fill) => <Focus3Icon fill={fill} />}
        />
      )}

      {((!!participationCitoyenneListe &&
        participationCitoyenneListe.length > 0) ||
        participationCitoyenne) && (
        <Stack>
          <ActeursListe
            titre="Participation Citoyenne"
            liste={(participationCitoyenneListe ?? []).map((p) => p)}
            comment={participationCitoyenne}
            icon={(fill) => <UserCommunityIcon fill={fill} />}
          />
        </Stack>
      )}
    </Card>
  );
};

export default Acteurs;

const ActeursListe = ({
  titre,
  liste,
  comment,
  icon,
}: {
  titre: string;
  liste: string[];
  comment?: string | null;
  icon: (fill: string) => JSX.Element;
}) => {
  return (
    <Stack gap={1.5} direction="row" className="items-center flex-wrap">
      {icon(colors.grey[8])}
      <Paragraph className="text-[0.65rem] text-grey-8">{titre} :</Paragraph>
      {liste.map((l) => (
        <Badge key={l} title={l} state="standard" light />
      ))}
      <Paragraph className="text-[0.65rem]">{comment}</Paragraph>
    </Stack>
  );
};
