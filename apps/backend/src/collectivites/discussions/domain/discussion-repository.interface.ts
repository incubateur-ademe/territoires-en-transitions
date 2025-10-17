import { CreateDiscussionType, DiscussionType, Result } from "./discussion.type";

export interface DiscussionRepository {
  create: (discussion: CreateDiscussionType) => Promise<Result<DiscussionType>>;
  // delete: (id: number) => void;
  // list: (collectiviteId: number, filters: DiscussionFilters) => DiscussionType[];
  findById: (id: number) => Promise<DiscussionType | null>;
  // findByActionId: (actionId: string) => DiscussionType | null;
  // findByCollectiviteId: (collectiviteId: number) => DiscussionType | null;
  // findByCollectiviteIdAndActionId: (collectiviteId: number, actionId: string) => DiscussionType | null;
}
