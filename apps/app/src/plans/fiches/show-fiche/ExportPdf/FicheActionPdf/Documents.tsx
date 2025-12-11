import { getAuthorAndDate } from '@/app/referentiels/preuves/Bibliotheque/utils';
import {
  DiscussIcon,
  FileIcon,
  LinkIcon,
} from '@/app/ui/export-pdf/assets/icons';
import {
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  StyledLink,
  Title,
} from '@/app/ui/export-pdf/components';
import { preset } from '@tet/ui';
import { AnnexeInfo } from '../../data/useAnnexesFicheActionInfos';
import { generateTitle } from '../../data/utils';

const { colors } = preset.theme.extend;

type DocumentCardProps = {
  annexe: AnnexeInfo;
};

const DocumentCard = ({ annexe }: DocumentCardProps) => {
  const { created_at, created_by_nom, commentaire, filename, titre, url } =
    annexe;

  if (!filename && !titre) return null;

  const isLink = !filename && titre;

  return (
    <Card
      wrap={false}
      gap={3}
      direction="row"
      className="w-[49%] p-3 items-start"
    >
      <Box className="bg-primary-3 rounded-md h-[18px] min-h-[18px] w-[18px] min-w-[18px] justify-center items-center shrink-0 mt-0.5">
        {isLink ? (
          <LinkIcon className="h-[10px] w-[10px]" />
        ) : (
          <FileIcon className="h-[10px] w-[10px]" />
        )}
      </Box>

      <Stack gap={1} className="w-full">
        {/* Titre */}
        {isLink ? (
          <StyledLink
            src={url ?? undefined}
            className="text-[0.7rem] text-primary-9 font-bold"
          >
            {generateTitle(titre)}
          </StyledLink>
        ) : (
          <Title variant="h6">{generateTitle(filename)}</Title>
        )}

        {/* Date de création et auteur */}
        <Paragraph className="text-grey-8 font-medium">
          {getAuthorAndDate(created_at, created_by_nom)}
        </Paragraph>

        {/* Commentaire */}
        {commentaire && commentaire.length && (
          <>
            <Divider className="w-full h-[0.5px] mt-1" />
            <Stack gap={1} direction="row" className="items-start">
              <DiscussIcon fill={colors.grey[7]} className="mt-0.5" />
              <Paragraph className="text-grey-8 text-[0.6rem] font-medium italic w-[95%]">
                {commentaire}
              </Paragraph>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};

type DocumentsProps = {
  annexes: AnnexeInfo[] | undefined;
};

const Documents = ({ annexes }: DocumentsProps) => {
  if (!annexes || annexes.length === 0) return null;

  const firstAnnexesList = annexes.slice(0, 2);
  const otherAnnexesList = annexes.slice(2);

  return (
    <>
      <Divider className="mt-2" />

      <Stack gap={2.5}>
        <Stack wrap={false}>
          <Title variant="h5" className="text-primary-8 uppercase">
            Documents
          </Title>
          <Stack gap={2.5} direction="row" className="flex-wrap">
            {firstAnnexesList.map((annexe) => (
              <DocumentCard key={annexe.id} annexe={annexe} />
            ))}
          </Stack>
        </Stack>

        {otherAnnexesList.length > 0 && (
          <Stack gap={2.5} direction="row" className="flex-wrap">
            {otherAnnexesList.map((annexe) => (
              <DocumentCard key={annexe.id} annexe={annexe} />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default Documents;
