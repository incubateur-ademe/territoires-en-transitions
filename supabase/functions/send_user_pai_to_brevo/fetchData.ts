const urlContact = 'https://api.brevo.com/v3/contacts/';
const headers : Headers = {
    'Accept' : 'application/json',
    'Api-key' : `${Deno.env.get('BREVO_API_KEY')}`,
    'Content-type' :  'application/json'
}

/**
 * Récupère les informations d'un contact Brevo via son email
 * https://developers.brevo.com/reference/getcontactinfo-1
 * @param email
 * @return le contact sous format json, null s'il n'existe pas
 */
export const getContactByEmail = async (email : string)
    : Promise<any> => {
    const response = await fetch(
        urlContact +email,
        {
            method: 'GET',
            headers: headers
        })
    if (!response.ok) {
        if(response.status==404){
            // L'utilisateur n'existe pas dans Brevo
            return null;
        }else{
            throw new Error(`Error! status: ${response.status}`);
        }
    }
    return await response.json();
}

/**
 * Ajoute des contacts à une liste Brevo via leurs emails
 * https://developers.brevo.com/reference/addcontacttolist-1
 * @param emails
 * @param list
 */
export const addContactsToList = async (emails : string[], list : number)
    : Promise<any> => {
    const response = await fetch(
        urlContact +'lists/' +list +'/contacts/add',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({emails : emails})
        });
    if (!response.ok) {
        console.log("Les contacts "+emails +" n'ont pas pu être ajouté à la liste #" +list +".");
        return null
    }
    return await response.json();
}

/**
 * Ajoute un contact à Brevo
 * https://developers.brevo.com/reference/createcontact
 * @param user (nom, prenom, derniere_connexion, email)
 */
export const addContact = async (user : any)
    : Promise<any> => {
    const response = await fetch(
        urlContact,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                attributes :
                    {
                        NOM : user.nom,
                        PRENOM : user.prenom,
                        DATECONNEXION : user.derniere_connexion
                    },
                updateEnabled : false,
                email : user.email
            })
        });
    if (!response.ok) {
        console.log("Le contact "+user.email +" n'a pas pu être créé.");
        return null
    }
    return await response.json();
}

/**
 * Enlève des contacts à une liste Brevo via leurs emails
 * https://developers.brevo.com/reference/removecontactfromlist
 * @param emails
 * @param list
 */
export const removeContactsFromList = async (emails : string[], list : number)
    : Promise<any> => {
    const response = await fetch(
        urlContact +'lists/' +list +'/contacts/remove',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({emails : emails})
        });
    if (!response.ok) {
        console.log("Les contacts "+emails +" n'ont pas pu être enlevé de la liste #" +list +".");
        return null
    }
    return await response.json();
}