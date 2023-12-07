import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";
import {addContact, addContactsToList, getContactByEmail} from "./fetchData.ts";

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
            const list = Number(listUser.list);
            const users = listUser.users;
            let emails: string[] = [];
            if(users){
                for (let user of users){
                    const email =  user.email;
                    if(email){
                        // Vérifie si le contact existe déjà dans Brevo
                        const contactJson = await getContactByEmail(email);
                        if(contactJson){
                            // Vérifie si le contact appartient déjà à la liste
                            if (!contactJson.listIds.includes(list)){
                                emails.push(email);
                            }
                        }else{
                            // Crée le contact s'il n'existe pas
                            if(await addContact(user)){
                                emails.push(email);
                            }
                        }
                    }
                }
            }
            if(emails.length>0){
                // Ajoute les contacts à la liste
                await addContactsToList(emails, list);
            }
        }
    }
    return new Response(
        JSON.stringify(data),
        { headers: { "Content-Type": "application/json" } },
    )
})



