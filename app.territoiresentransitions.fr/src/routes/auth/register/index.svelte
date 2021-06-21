<script lang="ts">
    import {UtilisateurInscriptionInterface} from "../../../../../generated/models/utilisateur_inscription";
    import {maximumLengthValidatorBuilder, requiredValidator} from "../../../api/validators";
    import {joinValidators, validate} from "../../../api/validator";
    import LabeledTextInput from "../../../components/shared/Forms/LabeledTextInput.svelte";
    import Button from "../../../components/shared/Button/Button.svelte";
    import {getCurrentAPI} from "../../../api/currentAPI";

    const politique_vie_privee = "https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel"

    const inscription: UtilisateurInscriptionInterface = {
        email: '',
        nom: '',
        prenom: '',
        vie_privee_conditions: '',
    }

    const validators = {
        email: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        nom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        prenom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        vie_privee_conditions: requiredValidator,
    }

    let registrationResponse: Response
    let success: Boolean
    let error: String
    let acceptViePrivee: Boolean = false
    $: acceptViePrivee, updateViePrivee(acceptViePrivee)

    const updateViePrivee = (accept: Boolean) => {
        inscription.vie_privee_conditions = accept ? politique_vie_privee : ''
    }

    const register = async () => {
        for (let key of Object.keys(validators)) {
            let valid = validate(inscription[key], validators[key])
            if (!valid) return window.alert(`Le champ ${key} du formulaire n'est pas valide : ${validators[key](inscription[key])}`);
        }

        const api = getCurrentAPI()
        const endpoint = `${api}/v2/auth/register`

        registrationResponse = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(inscription)
        });

        success = registrationResponse.ok
        if (!registrationResponse.ok) {
            const contents = await registrationResponse.json()
            error = contents['detail']['message']
        }
    }
</script>

<section class="flex flex-col">
    <div class="pb-10"></div>

    {#if registrationResponse}
        {#if success}
            <h1 class="text-2xl">Votre compte</h1>
            <div class="pb-10"></div>
            <p>Votre compte "{inscription.email}" a bien été créé.</p>
            <div class="p-5"></div>
            <p>Lors de votre première connexion cliquez sur "Mot de passe oublié ?" afin de créer votre mot de
                passe.</p>
            <div class="p-5"></div>
            <div>
                <Button asLink href="/auth/signin/">
                    Me connecter
                </Button>
            </div>
        {:else }
            <h1 class="text-2xl">Erreur</h1>
            <div class="pb-10"></div>
            <p>Le compte "{inscription.email}" n'a pas pu être créé.</p>
            <div class="pb-5"></div>
            {#if error}
                <p>{error}</p>
            {:else }
                <p>Erreur indéterminée</p>
            {/if}
        {/if}

    {:else }

        <h1 class="text-2xl">Créer un compte</h1>
        <div class="pb-10"></div>
        <form class="flex flex-col w-full md:w-3/4 pb-10">
            <LabeledTextInput bind:value={inscription.email}
                              maxlength="300"
                              validator={validators.email}>
                <div class="text-xl">Adresse mail</div>
            </LabeledTextInput>
            <div class="p-5"></div>

            <LabeledTextInput bind:value={inscription.nom}
                              maxlength="300"
                              validator={validators.nom}>
                <div class="text-xl">Nom</div>
            </LabeledTextInput>
            <div class="p-5"></div>

            <LabeledTextInput bind:value={inscription.prenom}
                              maxlength="300"
                              validator={validators.prenom}>
                <div class="text-xl">Prénom</div>
            </LabeledTextInput>
            <div class="p-5"></div>

            <label class="inline-flex items-center">
                <input type=checkbox
                       class="form-checkbox"
                       bind:checked={acceptViePrivee}>
                <span class="ml-2">
                    J'accepte la <a class=" underline text-blue-600" href={politique_vie_privee}>politique de protection
                    des données à caractère personnel de l'ADEME</a>
                </span>
            </label>
            <div class="p-5"></div>

            <Button on:click={register}>
                Créer mon compte
            </Button>
        </form>
    {/if}
</section>
