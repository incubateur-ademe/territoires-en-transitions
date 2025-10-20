import {
  addTestCollectivite,
  Collectivite,
  TestCollectiviteArgs,
} from '@/domain/collectivites';
import { FicheCreate } from '@/domain/plans/fiches';
import type { AppRouter } from '@/domain/trpc-router';
import { addTestUser, TestUser, TestUserArgs } from '@/domain/users';
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

  constructor(
    public readonly data: TestUser,
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

  async createFiches(fiches: FicheCreate[]) {
    if (!this.trpcClient) {
      throw new Error('Trpc client not setup');
    }
    const createdFichesPromises = fiches.map((fiche) => {
      console.log('Create fiche', fiche);
      return this.trpcClient!.plans.fiches.create.mutate(fiche);
    });
    const createdFicheIds = await Promise.all(createdFichesPromises);
    this.ficheIds.push(...createdFicheIds);
    return createdFicheIds;
  }

  async cleanup() {
    if (this.trpcClient) {
      console.log('Cleanup fiches', this.ficheIds);
      const cleanupFichesPromises = this.ficheIds.map((ficheId) => {
        return this.trpcClient!.plans.fiches.delete.mutate({ ficheId });
      });
      await Promise.all(cleanupFichesPromises);
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
  async addCollectivite(nomCollectivite?: string) {
    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      {
        nom:
          nomCollectivite ||
          `Collectivité ${Math.random().toString().substring(2, 6)}`,
      }
    );
    const collectiviteFixture = new CollectiviteFixture(collectivite, cleanup);
    this.fixtures.push(collectiviteFixture);
    return collectiviteFixture;
  }

  // ajoute une collectivité et un utilisateur rattaché à celle-ci
  async addCollectiviteAndUser(
    args?: Omit<TestUserArgs, 'collectiviteId'> & TestCollectiviteArgs
  ) {
    const { nom, ...userArgs } = args || {};
    const collectivite = await this.addCollectivite(nom);
    const user = await this.addUser({
      permissionLevel: 'admin',
      cguAcceptees: true,
      ...userArgs,
      collectiviteId: collectivite.data.id,
    });
    return { collectivite, user };
  }

  async addCollectiviteAndUserWithLogin(
    context: BrowserContext,
    args?: Omit<TestUserArgs, 'collectiviteId'> & TestCollectiviteArgs
  ) {
    const { collectivite, user } = await this.addCollectiviteAndUser(args);
    await user.loginAndSetupTrpcClient(context);
    return { collectivite, user };
  }

  async cleanup() {
    for (const fixture of this.fixtures.reverse()) {
      await fixture.cleanup();
    }
  }
}

export const testWithUsers = test.extend<{ users: Users }>({
  users: async ({ page }, use) => {
    const users = new Users();
    await use(users);
    // Cleanup
    await users.cleanup();
  },
});
