import { preset } from '../ui-compat';
import { DiscussIcon, FileIcon, LinkIcon } from '../assets/icons';
import type { AnnexeDocument } from '@tet/domain/plans';
import {
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  StyledLink,
  Title,
} from '../primitives';
import { generateTitle, getAuthorAndDate } from './external-helpers';

const { colors } = preset.theme.extend;

type DocumentCardProps = {
  annexe: AnnexeDocument;
};

const DocumentCard = ({ annexe }: DocumentCardProps) => {
  const { modifiedAt, modifiedByNom, commentaire } = annexe;
  const filename = annexe.fichier?.filename ?? null;
  const titre = annexe.lien?.titre ?? null;
  const url = annexe.lien?.url ?? null;

  if (!filename && !titre) return null;

  const isLink = annexe.lien !== null;

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
          {getAuthorAndDate(modifiedAt, modifiedByNom)}
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
  annexes: AnnexeDocument[] | undefined;
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
