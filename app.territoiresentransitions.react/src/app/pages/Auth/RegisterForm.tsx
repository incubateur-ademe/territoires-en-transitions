import {UtilisateurInscriptionInterface} from "generated/models/utilisateur_inscription";
import {joinValidators, validate} from "core-logic/api/validator";
import {emailValidator, maximumLengthValidatorBuilder, requiredValidator} from "core-logic/api/validators";
import {useState} from "react";
import {LabeledTextInput} from "ui";
import {ENV} from "environmentVariables";

const RegistrationSuccess = (props: { inscription: UtilisateurInscriptionInterface }) => {
    return (
        <>
            <h1 className="text-2xl">Votre compte</h1>
            <div className="pb-10"/>
            <p>Votre compte "{props.inscription.email}" a bien été créé.</p>
            <div className="p-5"/>
            <p>Lors de votre première connexion cliquez sur "Mot de passe oublié ?" afin de créer votre mot de
                passe.</p>
            <div className="p-5"/>
            <div>
                <a href="/auth/signin/">
                    Me connecter
                </a>
            </div>
        </>
    )
}

const RegistrationError = (props: { message: string, inscription: UtilisateurInscriptionInterface }) => {
    return (
        <>
            <h1 className="text-2xl">Erreur</h1>
            <div className="pb-10"/>
            <p>Le compte "{props.inscription.email}" n'a pas pu être créé.</p>
            <div className="pb-5"/>
            <p>{props.message}</p>
        </>
    )
}

const validators = {
    email: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300), emailValidator]),
    nom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
    prenom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
    vie_privee_conditions: requiredValidator,
}
const politique_vie_privee = "https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel"

const RegistrationForm = () => {
    const [inscription, setInscription] = useState<UtilisateurInscriptionInterface>({
        email: '',
        nom: '',
        prenom: '',
        vie_privee_conditions: '',
    });

    const register = async () => {
        for (let key of Object.keys(validators)) {
            // @ts-ignore
            let valid = validate(inscription[key], validators[key])
            if (!valid) return window.alert(`Le champ ${key} du formulaire n'est pas valide : ${validators[key](inscription[key])}`);
        }

        const endpoint = `${ENV.backendHost}/v2/auth/register`

        const registrationResponse = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inscription)
        });

        const success = registrationResponse.ok
        if (!registrationResponse.ok) {
            const contents = await registrationResponse.json()
            const error = contents['detail']['message']
        }
    }

    return (
        <>

            <h1 className="text-2xl">Créer un compte</h1>
            <div className="pb-10"/>
            <div>Si vous avez déjà un compte ADEME, <a className="text-blue-600" href="/auth/signin/">connectez-vous
                directement
                par ici</a>.
            </div>
            <div className="p-5"/>
            <form className="flex flex-col w-full md:w-3/4 pb-10">
                <div>Tous les champs sont obligatoires.</div>
                <div className="p-5"/>
                <LabeledTextInput initialValue={inscription.nom}
                                  validateOnMount={false}
                                  maxlength={300}
                                  validator={validators.nom}>
                    <div className="text-xl">Nom</div>
                </LabeledTextInput>
                <div className="p-5"/>

                <LabeledTextInput initialValue={inscription.prenom}
                                  validateOnMount={false}
                                  maxlength={300}
                                  validator={validators.prenom}>
                    <div className="text-xl">Prénom</div>
                </LabeledTextInput>
                <div className="p-5"/>

                <LabeledTextInput initialValue={inscription.email}
                                  validateOnMount={false}
                                  maxlength={300}
                                  validator={validators.email}>
                    <div className="text-xl">Adresse mail</div>
                </LabeledTextInput>
                <div className="p-5"/>


                <label className="inline-flex items-center">
                    <input type="checkbox"
                           className="form-checkbox"/>
                    <span className="ml-2">
                    J'accepte la <a target="_blank" rel="noopener noreferrer" className="underline text-blue-600"
                                    href={politique_vie_privee}>politique de protection
                    des données à caractère personnel de l'ADEME</a>
                </span>
                </label>
                <div className="p-5"/>

                <button className="fr-btn" onClick={register}>
                    Créer mon compte
                </button>
            </form>

        </>
    )
}