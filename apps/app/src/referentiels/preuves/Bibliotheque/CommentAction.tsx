import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';

type CommentActionProps = {
  onComment: () => void;
};

export const CommentAction = ({ onComment }: CommentActionProps) => (
  <Button
    data-test="btn-comment"
    icon="discuss-line"
    title={appLabels.commenter}
    variant="grey"
    size="xs"
    onClick={onComment}
  />
);
