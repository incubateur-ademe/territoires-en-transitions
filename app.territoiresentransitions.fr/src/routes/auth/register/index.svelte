<script lang="ts">
    import {UtilisateurInscriptionInterface} from "../../../../../generated/models/utilisateur_inscription";
    import {maximumLengthValidatorBuilder, numbersOnlyValidator, requiredValidator} from "../../../api/validators";
    import {alwaysValid, joinValidators, validate} from "../../../api/validator";
    import LabeledTextInput from "../../../components/shared/Forms/LabeledTextInput.svelte";
    import Button from "../../../components/shared/Button/Button.svelte";
    import PickButton from "../../../components/shared/Button/PickButton.svelte";
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

        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'no-cors', // fixme: not normal
            body: JSON.stringify(inscription)
        });

        console.log(response)
        console.log(await response.json())
    }
</script>

<h1>Registration form</h1>
<section class="flex flex-col">
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

        <PickButton picked={inscription.vie_privee}
                    handlePick={toggle_politique}
                    handleUnpick={toggle_politique}
                    pickLabel="Je n'accepte pas la politique de protection des données à caractère personnel"
                    unpickLabel="✓ J'accepte la politique de protection des données à caractère personnel"
        />
        <a href={politique_vie_privee}>Politique de protection des données à caractère personnel de l'ADEME</a>
        <div class="p-5"></div>

        <Button on:click={register}>
            Créer mon compte
        </Button>
    </form>
</section>
