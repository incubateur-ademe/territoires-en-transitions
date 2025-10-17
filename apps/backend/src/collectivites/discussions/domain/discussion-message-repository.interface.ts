import { CreateDiscussionMessageType, DiscussionMessageType, Result } from "./discussion.type";

export interface DiscussionMessageRepository {
  create: (discussionMessage: CreateDiscussionMessageType) => Promise<Result<DiscussionMessageType>>;
  // delete: (id: number) => void;
  // list: (collectiviteId: number, filters: DiscussionFilters) => DiscussionType[];
  // findById: (id: number) => DiscussionType | null;
  // findByActionId: (actionId: string) => DiscussionType | null;
  // findByCollectiviteId: (collectiviteId: number) => DiscussionType | null;
  // findByCollectiviteIdAndActionId: (collectiviteId: number, actionId: string) => DiscussionType | null;
}
