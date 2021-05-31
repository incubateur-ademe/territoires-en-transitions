<script lang="ts">
    import {FicheActionStorable} from "../../storables/FicheActionStorable"
    import Button from "../../components/shared/Button/Button.svelte"
    import MultiSelect from './_MultiSelect.svelte'
    import CategoriePicker from './_CategoriePicker.svelte'
    import Status from './_Status.svelte'
    import {FicheActionInterface} from "../../../../generated/models/fiche_action"
    import {onMount} from "svelte"
    import {HybridStore} from "../../api/hybridStore"
    import {testUIVisibility} from "../../api/currentEnvironment";
    import {IndicateurReferentiel} from "../../../../generated/models/indicateur_referentiel";
    import IndicateurReferentielCard
        from "../../components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import {IndicateurPersonnalise} from "../../../../generated/models/indicateur_personnalise";
    import IndicateurPersonnaliseCard
        from "../../components/shared/IndicateurPersonnalise/IndicateurPersonnaliseCard.svelte";
    import IndicateurPersonnaliseCreation
        from "../../components/shared/IndicateurPersonnalise/IndicateurPersonnaliseCreation.svelte";
    import LabeledTextArea from "../../components/shared/Forms/LabeledTextArea.svelte";
    import LabeledTextInput from "../../components/shared/Forms/LabeledTextInput.svelte";
    import {alwaysValid, joinValidators, validate} from "../../api/validator";
    import {maximumLengthValidatorBuilder, numbersOnlyValidator, requiredValidator} from "../../api/validators";

    export let data: FicheActionInterface

    let ficheActionStore: HybridStore<FicheActionStorable>

    let showLinkActionDialog = false
    let useIndicateursPersonnalises = false


    const validators = {
        epci_id: maximumLengthValidatorBuilder(36),
        uid: maximumLengthValidatorBuilder(36),
        custom_id: maximumLengthValidatorBuilder(36),
        avancement: maximumLengthValidatorBuilder(36),
        referentiel_action_ids: alwaysValid,
        referentiel_indicateur_ids: alwaysValid,
        titre: joinValidators([requiredValidator, maximumLengthValidatorBuilder(300)]),
        description: alwaysValid,
        budget: numbersOnlyValidator,
        personne_referente: maximumLengthValidatorBuilder(100),
        structure_pilote: maximumLengthValidatorBuilder(300),
        partenaires: maximumLengthValidatorBuilder(300),
        elu_referent: maximumLengthValidatorBuilder(300),
        commentaire: alwaysValid,
        date_debut: maximumLengthValidatorBuilder(36),
        date_fin: maximumLengthValidatorBuilder(36),
        indicateur_personnalise_ids: alwaysValid,
    }

    // Save the form data
    const handleSave = async () => {
        for (let key of Object.keys(validators)) {
            let valid = validate(data[key], validators[key])
            if (!valid) return window.alert(`Le champ ${key} du formulaire n'est pas valide : ${validators[key](data[key])}`);
        }

        const fiche = new FicheActionStorable(data)
        const saved = await ficheActionStore.store(fiche)

        if (saved.uid) window.location.href = `/fiches/?epci_id=${data.epci_id}`
        else window.alert('Une erreur est survenue lors de la sauvegarde de la fiche action.')

    }

    // Indicateur référentiel list to pick from.
    let indicateursReferentiel: IndicateurReferentiel[]

    // Indicateur personnalise list to pick from.
    let indicateursPersonnalises: IndicateurPersonnalise[]

    // Show the indicateur personnalisé creation form.
    let showIndicateurCreation = false

    // Called when the indicateur personnalisé form.
    const indicateurSaved = async (event) => {
        showIndicateurCreation = false

        const hybridStores = await import ("../../api/hybridStores")
        indicateursPersonnalises = await hybridStores.indicateurPersonnaliseStore.retrieveAll()
        data.indicateur_personnalise_ids.push(event.detail.indicateur.id)
    }

    // Helper to check reactively if an action is linked to the current fiche
    const isActionLinkedToFiche = (actionId) => data.referentiel_action_ids.includes(actionId)

    // Update the array of action ids linked to the current fiche
    const toggleActionId = (actionId) => {
        const actionIds = data.referentiel_action_ids

        if (isActionLinkedToFiche(actionId)) {
            data.referentiel_action_ids = actionIds.filter((id) => id != actionId)
        } else {
            data.referentiel_action_ids = [...actionIds, actionId]
        }
    }

    onMount(async () => {
        // initialize store
        const hybridStores = await import ("../../api/hybridStores")
        ficheActionStore = hybridStores.ficheActionStore

        // load référentiel indicateurs
        const indicateurs = await import("../../../../generated/data/indicateurs_referentiels")
        indicateursReferentiel = indicateurs.indicateurs

        // load indicateurs personnalisés
        indicateursPersonnalises = await hybridStores.indicateurPersonnaliseStore.retrieveAll()

        // show test ui
        useIndicateursPersonnalises = testUIVisibility()
    });
</script>

<svelte:head>
    {#if showLinkActionDialog }
        <style>
            body {
                overflow: hidden;
            }
        </style>
    {/if}
</svelte:head>

<section class="flex flex-col">
    <form class="flex flex-col w-full md:w-3/4 pb-10">
        <LabeledTextInput bind:value={data.custom_id}
                          hint="ex: 1.2.3, A.1.a, 1.1 permet le classement"
                          maxlength="36"
                          validator={validators.custom_id}>
            <div class="text-xl">Numérotation de l'action</div>
        </LabeledTextInput>
        <div class="p-5"></div>


        <LabeledTextInput bind:value={data.titre}
                          maxlength="36"
                          validator={validators.titre}>
            <div class="text-xl">Titre</div>
        </LabeledTextInput>
        <div class="p-5"></div>

        <CategoriePicker ficheActionUid={data.uid}/>

        <LabeledTextArea bind:value={data.description}
                         validator={validators.description}>
            <div class="text-xl">Description</div>
        </LabeledTextArea>
        <div class="p-5"></div>

        <Status bind:avancementKey={data.avancement}
                id="{data.uid}"/>
        <div class="p-5"></div>


        <LabeledTextInput bind:value={data.structure_pilote}
                          maxlength="300"
                          validator={validators.structure_pilote}>
            <div class="text-xl">Structure pilote</div>
        </LabeledTextInput>
        <div class="p-5"></div>

        <LabeledTextInput bind:value={data.personne_referente}
                          maxlength="300"
                          validator={validators.personne_referente}>
            <div class="text-xl">Personne référente</div>
        </LabeledTextInput>
        <div class="p-5"></div>

        <LabeledTextInput bind:value={data.elu_referent}
                          maxlength="300"
                          validator={validators.elu_referent}>
            <div class="text-xl">Élu référent</div>
        </LabeledTextInput>
        <div class="p-5"></div>

        <LabeledTextInput bind:value={data.partenaires}
                          maxlength="300"
                          validator={validators.partenaires}>
            <div class="text-xl">Partenaires</div>
        </LabeledTextInput>
        <div class="p-5"></div>

        <LabeledTextInput bind:value={data.budget}
                          hint="Ce champ ne doit comporter que des chiffres sans espaces"
                          validator={validators.budget}>
            <div class="text-xl">Budget global</div>
        </LabeledTextInput>
        <div class="p-5"></div>


        <LabeledTextArea bind:value={data.commentaire}>
            <div class="text-xl">Commentaire</div>
        </LabeledTextArea>
        <div class="p-5"></div>

        <span class="text-xl">Calendrier</span>
        <div class="flex">
            <div class="flex-1 flex flex-col pr-1">
                <label for="fiche_create_debut">date de début</label>
                <input bind:value={data.date_debut}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                       id="fiche_create_debut"
                       type="date">
                <div class="p-5"></div>
            </div>

            <div class="flex-1 flex flex-col pl-1">
                <label for="fiche_create_fin">date de fin</label>
                <input bind:value={data.date_fin}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                       id="fiche_create_fin"
                       type="date">
                <div class="p-5"></div>
            </div>
        </div>


        <div class="p-5"></div>
        <div class="text-xl">Référentiels</div>
        <div class="my-2 p-2">
            {#await import('./_LinkedActions.svelte') then c}
                <svelte:component this={c.default}
                                  actionIds={data.referentiel_action_ids}
                                  handlePickButton={toggleActionId}
                />
            {/await}
            <Button on:click={() => showLinkActionDialog = true }
                    size="small">
                + Lier une action
            </Button>
        </div>

        <div class="p-5"></div>
        <div class="my-2 p-2">
            <div class="text-xl mb-4">Indicateurs référentiel</div>
            {#if indicateursReferentiel}
                <MultiSelect id='fiche_create_indicateurs' bind:value={data.referentiel_indicateur_ids}>
                    {#each indicateursReferentiel as indicateur}
                        <option value="{indicateur.id}">({indicateur.id}) {indicateur.nom}</option>
                    {/each}
                </MultiSelect>

                {#each data.referentiel_indicateur_ids as indicateurId}
                    <div class="shadow">
                        <IndicateurReferentielCard
                                indicateur={indicateursReferentiel.filter((i) => i.id === indicateurId)[0]}/>
                    </div>
                {/each}
            {/if}
        </div>


        <div class="p-5"></div>
        <div class="my-2 p-2">
            <div class="flex flex-row w-full items-center">
                <h3 class="text-xl">Indicateurs personnalisés</h3>
                <div class="flex flex-grow"></div>
                <Button colorVariant={showIndicateurCreation ? 'ash' : 'nettle'}
                        on:click={() => showIndicateurCreation = true }
                        size="small">
                    Créer un nouvel indicateur
                </Button>
            </div>
            {#if showIndicateurCreation}
                <IndicateurPersonnaliseCreation on:save={indicateurSaved}/>
            {/if}

            <div class="p-5"></div>
            {#if indicateursPersonnalises}
                <MultiSelect id='fiche_create_indicateurs' bind:value={data.indicateur_personnalise_ids}>
                    {#each indicateursPersonnalises as indicateur}
                        <option value="{indicateur.id}">{indicateur.nom}</option>
                    {/each}
                </MultiSelect>

                {#each data.indicateur_personnalise_ids as indicateurId}
                    <div class="shadow">
                        <IndicateurPersonnaliseCard
                                indicateur={indicateursPersonnalises.filter((i) => i.id === indicateurId)[0]}/>
                    </div>
                {/each}
            {/if}
        </div>

        <div class="p-5"></div>
        <Button classNames="md:w-1/3 self-end"
                full
                on:click={handleSave}>
            Valider
        </Button>
    </form>

    {#if showLinkActionDialog}
        {#await import('./linkActionDialog/_LinkActionDialog.svelte') then c}
            <svelte:component this={c.default}
                              on:LinkActionDialogClose={() => showLinkActionDialog = false }
                              linkedActionIds={data.referentiel_action_ids}
                              toggleActionId={toggleActionId}
            />
        {/await}
    {/if}
</section>