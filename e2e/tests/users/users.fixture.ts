import { addTestCollectivite, Collectivite } from '@/domain/collectivites';
import {
  BulkEditRequest,
  FicheCreate,
  UpdateFicheRequest,
} from '@/domain/plans';
import type { AppRouter } from '@/domain/trpc-router';
import { addTestUser, Dcp, TestUserArgs } from '@/domain/users';
import { BrowserContext, test } from '@playwright/test';
import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client';
import { databaseService } from '../fixtures/database.service';
import { SupabaseClient } from '../fixtures/supabase-client.utils';

const baseApiURL = process.env.BASE_API_URL || 'http://localhost:8080';

// Extract project reference from Supabase URL for cookie name
// e.g., "http://127.0.0.1:54321" -> "127"
// e.g., "https://abc123.supabase.co" -> "abc123"
function getSupabaseProjectRef(url: string): string {
  const urlObj = new URL(url);
  if (
    urlObj.hostname === 'localhost' ||
    urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
  ) {
    // For localhost/IP addresses, use the first part before the first dot
    return urlObj.hostname.split('.')[0];
  }
  // For hosted Supabase, extract subdomain (project ref)
  return urlObj.hostname.split('.')[0];
}

interface IFixtureData {
  cleanup(): Promise<void>;
}
class UserFixture implements IFixtureData {
  private trpcClient: TRPCClient<AppRouter> | null = null;

  private readonly ficheIds: number[] = [];
  private readonly discussionIds: number[] = [];
  private collectiviteId: number | null = null;
  constructor(
    public readonly data: Dcp & { password: string },
    private readonly mainCleanup: () => Promise<void>
  ) {}

  async loginAndSetupTrpcClient(context: BrowserContext, force = false) {
    if (this.trpcClient && !force) {
      return this.trpcClient;
    }

    const supabaseUrl = process.env.SUPABASE_API_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_API_URL environment variable is not set');
    }

    const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    const requestInit: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        email: this.data.email,
        password: this.data.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(authUrl, requestInit);

    if (!response.ok) {
      throw new Error(`Authentication failed with status ${response.status}`);
    }

    const authData = await response.json();

    // Derive cookie name from Supabase URL
    const projectRef = getSupabaseProjectRef(supabaseUrl);
    const cookieName = `sb-${projectRef}-auth-token`;

    // Extract domain from URL (localhost for local development)
    const urlObj = new URL(supabaseUrl);
    const domain =
      urlObj.hostname === 'localhost' ||
      urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
        ? 'localhost'
        : urlObj.hostname;

    await context.addCookies([
      {
        name: cookieName,
        value: `base64-${Buffer.from(JSON.stringify(authData)).toString(
          'base64'
        )}`,
        path: '/',
        domain,
      },
    ]);

    console.log('Access token', authData.access_token);

    this.trpcClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseApiURL}/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: `Bearer ${authData.access_token}`,
            };
          },
        }),
      ],
    });

    return this.trpcClient;
  }

  getTrpcClient() {
    if (!this.trpcClient) {
      throw new Error('Trpc client not setup');
    }
    return this.trpcClient;
  }

  async createFiches(fiches: FicheCreate[]) {
    const trpcClient = this.getTrpcClient();
    const createdFichesPromises = fiches.map((fiche) => {
      console.log('Create fiche', fiche);
      return trpcClient.plans.fiches.create.mutate(fiche);
    });
    const createdFicheIds = await Promise.all(createdFichesPromises);
    this.ficheIds.push(...createdFicheIds);
    return createdFicheIds;
  }

  async createDiscussions(
    discussions: {
      collectiviteId: number;
      actionId: string;
      message: string;
    }[]
  ) {
    if (!this.trpcClient) {
      throw new Error('Trpc client not setup');
    }
    const trpcClient = this.trpcClient;
    const createdDiscussionsPromises = discussions.map((discussion) => {
      return trpcClient.collectivites.discussions.create.mutate(discussion);
    });
    const createdDiscussions = await Promise.all(createdDiscussionsPromises);
    const createdDiscussionIds = createdDiscussions.map((d) => d.id);
    this.discussionIds.push(...createdDiscussionIds);
    this.collectiviteId = discussions[0].collectiviteId;
    return createdDiscussionIds;
  }

  async updateFiches(fiches: UpdateFicheRequest[]) {
    const trpcClient = this.getTrpcClient();

    const updatedFichesPromises = fiches.map((fiche) => {
      console.log('Update fiche', fiche);
      return trpcClient.plans.fiches.update.mutate(fiche);
    });
    await Promise.all(updatedFichesPromises);
  }

  async bulkEditFiches(bulkEditRequest: BulkEditRequest) {
    const trpcClient = this.getTrpcClient();
    return trpcClient.plans.fiches.bulkEdit.mutate(bulkEditRequest);
  }

  async cleanup() {
    if (this.trpcClient) {
      const trpcClient = this.trpcClient;
      console.log('Cleanup fiches', this.ficheIds);
      const cleanupFichesPromises = this.ficheIds.map((ficheId) => {
        return trpcClient.plans.fiches.delete.mutate({ ficheId });
      });
      await Promise.all(cleanupFichesPromises);

      console.log('Cleanup discussions', this.discussionIds);
      if (this.discussionIds.length > 0 && this.collectiviteId) {
        const collectiviteId = this.collectiviteId;
        const cleanupDiscussionsPromises = this.discussionIds.map(
          (discussionId) => {
            return trpcClient.collectivites.discussions.delete.mutate({
              discussionId,
              collectiviteId,
            });
          }
        );
        await Promise.all(cleanupDiscussionsPromises);
      }
    }
    await this.mainCleanup();
  }
}

class CollectiviteFixture implements IFixtureData {
  constructor(
    public readonly data: Collectivite,
    private readonly mainCleanup: () => Promise<void>
  ) {}

  async cleanup() {
    await this.mainCleanup();
  }
}

export class Users {
  private readonly supabaseClient: SupabaseClient;

  private readonly fixtures: IFixtureData[] = [];

  constructor() {
    this.supabaseClient = new SupabaseClient();
  }

  // génère l'email et le password d'un utilisateur prédéfini
  getTestUser(userName: string) {
    const letter = userName.slice(1, userName.indexOf('l'));
    const dd = `d${letter}d${letter}`;
    return {
      email: `${userName}@${dd}.com`,
      password: `${userName}${dd}`,
    };
  }

  // ajoute un utilisateur
  async addUser(args?: TestUserArgs) {
    const { user, cleanup } = await addTestUser(databaseService, args);

    const userFixture = new UserFixture(user, cleanup);
    this.fixtures.push(userFixture);
    return userFixture;
  }

  // ajoute une collectivité
  async addCollectivite(collectiviteArgs?: Partial<Collectivite>) {
    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      collectiviteArgs
    );
    const collectiviteFixture = new CollectiviteFixture(collectivite, cleanup);
    this.fixtures.push(collectiviteFixture);
    return collectiviteFixture;
  }

  // ajoute une collectivité et un utilisateur rattaché à celle-ci
  async addCollectiviteAndUser(args?: {
    user?: Omit<TestUserArgs, 'collectiviteId'>;
    collectivite?: Partial<Collectivite>;
  }) {
    const { collectivite: collectiviteArgs, user: userArgs } = args || {};
    const collectivite = await this.addCollectivite(collectiviteArgs);
    const user = await this.addUser({
      accessLevel: 'admin',
      cguAcceptees: true,
      ...(userArgs || {}),
      collectiviteId: collectivite.data.id,
    });
    return { collectivite, user };
  }

  async addCollectiviteAndUserWithLogin(
    context: BrowserContext,
    args?: {
      user?: Omit<TestUserArgs, 'collectiviteId'>;
      collectivite?: Partial<Collectivite>;
    }
  ) {
    const { collectivite, user } = await this.addCollectiviteAndUser(args);
    await user.loginAndSetupTrpcClient(context);
    return { collectivite, user };
  }

  async cleanup() {
    console.log('Cleanup fixtures', this.fixtures);
    for (const fixture of this.fixtures.reverse()) {
      await fixture.cleanup();
    }
  }
}

export const testWithUsers = test.extend<{ users: Users }>({
  users: async ({}, use) => {
    const users = new Users();
    await use(users);
    // Cleanup
    await users.cleanup();
  },
});
