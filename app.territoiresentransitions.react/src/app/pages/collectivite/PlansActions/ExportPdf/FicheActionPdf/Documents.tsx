import { preset } from '@/ui';
import { DiscussIcon, FileIcon, LinkIcon } from 'ui/export-pdf/assets/icons';
import {
  Card,
  Divider,
  Paragraph,
  Stack,
  StyledLink,
  Title,
} from 'ui/export-pdf/components';
import { getAuthorAndDate } from 'ui/shared/preuves/Bibliotheque/utils';
import { AnnexeInfo } from '../../FicheAction/data/useAnnexesFicheActionInfos';
import { generateTitle } from '../../FicheAction/data/utils';

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
      <Stack className="bg-primary-3 rounded-md h-[18px] min-h-[18px] w-[18px] min-w-[18px] justify-center items-center shrink-0 mt-0.5">
        {isLink ? (
          <LinkIcon className="h-[10px] w-[10px]" />
        ) : (
          <FileIcon className="h-[10px] w-[10px]" />
        )}
      </Stack>

      <Stack gap={1} className="w-full">
        {/* Titre */}
        {isLink ? (
          <StyledLink
            src={url ?? undefined}
            className="text-primary-9 font-bold"
          >
            {generateTitle(titre)}
          </StyledLink>
        ) : (
          <Title variant="h6">{generateTitle(filename)}</Title>
        )}

        {/* Date de création et auteur */}
        <Paragraph className="text-[0.65rem] text-grey-8 font-medium">
          {getAuthorAndDate(created_at, created_by_nom)}
        </Paragraph>

        {/* Commentaire */}
        {commentaire && commentaire.length && (
          <>
            <Divider className="w-full" />
            <Stack gap={1} direction="row" className="items-center">
              <DiscussIcon fill={colors.grey[7]} />
              <Paragraph className="text-grey-8 text-[0.6rem] font-medium italic">
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

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Documents
      </Title>
      <Stack gap={3} direction="row" className="flex-wrap">
        {annexes.map((annexe) => (
          <DocumentCard key={annexe.id} annexe={annexe} />
        ))}
      </Stack>
    </Card>
  );
};

export default Documents;
