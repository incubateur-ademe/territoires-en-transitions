import { supabase } from "./supabase.ts";
import { delay } from "https://deno.land/std@0.163.0/async/delay.ts";

type credentials = {
  email: string;
  password: string;
};

/**
 * Génère l'email et le mot de passe pour les utilisateurs de test.
 *
 * @param nickname ex 'yolododo', 'youloudou'
 */
export function fakeCredentials(nickname: string): credentials {
  const match = nickname.toLowerCase().match(/(y.+l.+)(d.+d.+)/)!;
  const firstName = match[1];
  const lastName = match[2];

  return {
    email: `${firstName}@${lastName}.com`,
    password: `${firstName}${lastName}`,
  };
}

/**
 * Authentifie un utilisateur de test avec le client Supabase.
 *
 * @param nickname ex 'yolododo', 'youloudou'
 */
export async function signIn(nickname: string) {
  const credentials = fakeCredentials(nickname);
  return await supabase.auth.signInWithPassword(credentials);
}

/**
 * Déconnecte l'utilisateur du client Supabase.
 * Permet de libérer les ressources avant la fin des tests.
 */
export async function signOut() {
  const response = await supabase.auth.signOut();
  // parfois les ressources ne sont pas libérées assez rapidement.
  await delay(1);
  return response;
}
