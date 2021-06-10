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
        vie_privee: '',
    }

    const validators = {
        email: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        nom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        prenom: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        vie_privee: requiredValidator,
    }

    let registrationResponse: Response;

    const toggle_politique = () => {
        inscription.vie_privee = inscription.vie_privee ? '' : politique_vie_privee
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
    }
</script>

<section class="flex flex-col">
    <div class="pb-10"></div>

    {#if registrationResponse}
        {#if registrationResponse.ok}
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
            <p>Votre compte "{inscription.email}" n'a pas pû être créé.</p>
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

            <a class="flex w-full underline text-blue-600" href={politique_vie_privee}>Politique de protection des
                données à
                caractère personnel de l'ADEME</a>
            <div class="pb-3"></div>

            {#if inscription.vie_privee}
                <Button on:click={toggle_politique} classNames="w-full">
                    ✓ J'accepte la politique de protection des données à caractère personnel
                </Button>
            {:else }
                <Button on:click={toggle_politique} classNames="w-full">
                    Je n'accepte pas la politique de protection des données à caractère personnel
                </Button>
            {/if}
            <div class="p-5"></div>

            <Button on:click={register}>
                Créer mon compte
            </Button>
        </form>
    {/if}
</section>
