import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";
import {addContact, addContactsToList, getContactByEmail, removeContactsFromList} from './fetchData.ts';

const ID_LIST_BREVO_ONBOARDING_PAI = 87;
const ID_LIST_BREVO_ONBOARDING_GENERAL = 18;
const ID_LIST_BREVO_CREATION_PA = 75;
const ID_LIST_BREVO_SONDAGE_PA_1 = 76;
const ID_LIST_BREVO_SONDAGE_PA_2 = 77;

const LISTS_TO_REMOVE = [
  ID_LIST_BREVO_ONBOARDING_GENERAL,
  ID_LIST_BREVO_CREATION_PA,
  ID_LIST_BREVO_SONDAGE_PA_1,
  ID_LIST_BREVO_SONDAGE_PA_2
];

/**
 * Ajoute des contacts aux listes de Brevo
 * Format données :
 * {
 *     [
 *         list : number
 *         users : [
 *             email : string,
 *             nom : string,
 *             prenom : string,
 *             derniere_connexion : date
 *         ]
 *     ]
 * }
 */
serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (
      req.headers.get('authorization') !==
      `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  ) {
    // Seule la service key permet d'exécuter cette fonction.
    return new Response('Execute access forbidden', { status: 403 });
  }
  const data = await req.json();
  if(data!){
    for (let listUser of data){
      const users = listUser.users;
      let emails: string[] = [];
      if(users){
        for (let user of users){
          const email =  user.email;
          if(email){
            // Vérifie si le contact existe déjà dans Brevo
            const contactJson = await getContactByEmail(email);

            if(contactJson){
              console.log('get contact' +contactJson.email);
              // Vérifie si le contact appartient déjà à la liste
              if (!contactJson.listIds.includes(ID_LIST_BREVO_ONBOARDING_PAI)){
                emails.push(email);
              }
              // Vérifie si le contact appartient aux autres listes, et si oui, les enlève
              for(let listId of LISTS_TO_REMOVE){
                if (contactJson.listIds.includes(listId)){
                  await removeContactsFromList(emails, listId);
                  console.log('remove contact' +contactJson.email +' from list ' +listId);
                }
              }
            }else{
              // Ajoute le contact
              if(await addContact(user)){
                emails.push(email);
                console.log('add contact ' +email +' to Brevo');
              }
            }
          }

        }
      }
      if(emails.length>0){
        // Ajoute les contacts à la liste
        await addContactsToList(emails, ID_LIST_BREVO_ONBOARDING_PAI);
        console.log('add contacts ' +emails +' to the list ' +ID_LIST_BREVO_ONBOARDING_PAI);
      }
    }
  }
  return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
  )
})