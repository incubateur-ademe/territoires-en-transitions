import { BrowserContext, Cookie } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@tet/api';

type FuncName = keyof Database['public']['Functions'];
type Functions<Name extends FuncName> = Database['public']['Functions'][Name];

export type FuncArgs<Name extends FuncName> =
  Database['public']['Functions'][Name]['Args'];

export class SupabaseClient {
  private readonly client;

  constructor() {
    const url = process.env.SUPABASE_API_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials missing');
    }
    this.client = createClient<Database>(url, key);
  }

  // permet d'appeler les fonctions sql de test
  async rpc<Returns, Name extends FuncName = FuncName>(
    name: Name,
    args: Functions<Name>['Args']
  ) {
    const { data, error } = await this.client.rpc(name, args);
    if (error) {
      throw error;
    }
    return data as Returns;
  }

  /**
   * Récupère et valide l'URL Supabase depuis les variables d'environnement
   */
  getSupabaseUrl(): string {
    const supabaseUrl = process.env.SUPABASE_API_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_API_URL environment variable is not set');
    }
    return supabaseUrl;
  }

  /**
   * Extrait la référence du projet Supabase depuis l'URL pour le nom du cookie
   * e.g., "http://127.0.0.1:54321" -> "127"
   * e.g., "https://abc123.supabase.co" -> "abc123"
   */
  getSupabaseProjectRef(url: string): string {
    const urlObj = new URL(url);
    return urlObj.hostname.split('.')[0];
  }

  /**
   * Calcule le domaine du cookie à partir de l'URL Supabase
   */
  getCookieDomain(url: string): string {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' ||
      urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
      ? 'localhost'
      : urlObj.hostname;
  }

  /**
   * Construit le nom du cookie à partir de l'URL Supabase
   */
  getCookieName(url: string): string {
    const projectRef = this.getSupabaseProjectRef(url);
    return `sb-${projectRef}-auth-token`;
  }

  /**
   * Authentifie un utilisateur via Supabase et retourne les informations d'authentification
   * @param email L'email de l'utilisateur
   * @param password Le mot de passe de l'utilisateur
   * @returns Les informations d'authentification (accessToken et cookie)
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    cookie: Cookie;
  }> {
    const supabaseUrl = this.getSupabaseUrl();

    const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    const requestInit: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
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

    const cookie: Cookie = {
      name: this.getCookieName(supabaseUrl),
      value: `base64-${Buffer.from(JSON.stringify(authData)).toString(
        'base64'
      )}`,
      path: '/',
      domain: this.getCookieDomain(supabaseUrl),
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
      expires: -1,
    };

    return {
      accessToken: authData.access_token,
      cookie,
    };
  }

  /**
   * Ajoute le cookie de session au contexte du navigateur
   * @param context Le contexte du navigateur Playwright
   * @param cookie Le cookie à ajouter
   */
  async addAuthCookie(context: BrowserContext, cookie: Cookie): Promise<void> {
    await context.addCookies([cookie]);
  }

  /**
   * Supprime le cookie de session du contexte du navigateur
   * @param context Le contexte du navigateur Playwright
   */
  async removeAuthCookie(context: BrowserContext): Promise<void> {
    const supabaseUrl = this.getSupabaseUrl();
    const cookieName = this.getCookieName(supabaseUrl);
    const domain = this.getCookieDomain(supabaseUrl);

    await context.clearCookies({ domain, name: cookieName });
  }
}
