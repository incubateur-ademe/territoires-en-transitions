<script lang="ts">
    import {FicheActionStorable} from "$storables/FicheActionStorable"
    import MultiSelect from './_MultiSelect.svelte'
    import CategoriePicker from './_CategoriePicker.svelte'
    import Status from './_Status.svelte'
    import type {FicheActionInterface} from "$generated/models/fiche_action"
    import {onMount} from "svelte"
    import type {HybridStore} from "$api/hybridStore"
    import {testUIVisibility} from "$api/currentEnvironment";
    import type {IndicateurReferentiel} from "$generated/models/indicateur_referentiel";
    import IndicateurPersonnaliseCard
        from "$components/shared/IndicateurPersonnalise/IndicateurPersonnaliseCard.svelte";
    import IndicateurPersonnaliseCreation
        from "$components/shared/IndicateurPersonnalise/IndicateurPersonnaliseCreation.svelte";
    import LabeledTextArea from "$components/shared/Forms/LabeledTextArea.svelte";
    import LabeledTextInput from "$components/shared/Forms/LabeledTextInput.svelte";
    import {alwaysValid, joinValidators, validate} from "$api/validator";
    import {
        booleanValidator,
        maximumLengthValidatorBuilder,
        numbersOnlyValidator,
        requiredValidator
    } from "$api/validators";
    import CheckboxInput from "$components/shared/Forms/CheckboxInput.svelte";
    import type { IndicateurPersonnaliseStorable } from "$storables/IndicateurPersonnaliseStorable";
    import LinkedActions from "./_LinkedActions.svelte"
    import LinkActionDialog from "./linkActionDialog/_LinkActionDialog.svelte"

    export let data: FicheActionInterface
    

    let ficheActionStore: HybridStore<FicheActionStorable>

    let showLinkActionDialog = false
    let useIndicateursPersonnalises = false


    const validators = {
        epci_id: maximumLengthValidatorBuilder(36),
        uid: maximumLengthValidatorBuilder(36),
        custom_id: maximumLengthValidatorBuilder(36),
        avancement: maximumLengthValidatorBuilder(36),
        en_retard: booleanValidator,
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
    let indicateursPersonnalises: IndicateurPersonnaliseStorable[]

    // Show the indicateur personnalisé creation form.
    let showIndicateurCreation = false

    // Called when the indicateur personnalisé form.
    const indicateurSaved = async (event) => {
        showIndicateurCreation = false

        const hybridStores = await import ("$api/hybridStores")
        indicateursPersonnalises = await hybridStores.indicateurPersonnaliseStore.retrieveAll()
        data.indicateur_personnalise_ids.push(event.detail.indicateur.id)
    }

    // Helper to check reactively if an action is linked to the current fiche
    const isActionLinkedToFiche = (actionId) => data.referentiel_action_ids.includes(actionId)

    // Update the array of action ids linked to the current fiche
    const toggleActionId = (actionId: string): void => {
        const actionIds = data.referentiel_action_ids

        if (isActionLinkedToFiche(actionId)) {
            data.referentiel_action_ids = actionIds.filter((id) => id != actionId)
        } else {
            data.referentiel_action_ids = [...actionIds, actionId]
        }
    }

    onMount(async () => {
        // initialize store
        const hybridStores = await import ("$api/hybridStores")
        ficheActionStore = hybridStores.ficheActionStore

        // load référentiel indicateurs
        const indicateurs = await import("$generated/data/indicateurs_referentiels")
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

<style>
    .calendar {
        display: flex;
    }

    .calendar div + div {
        margin-left: 6rem;
    }

    form {
        max-width: 70%;
    }

    form :global(fieldset) {
        margin-bottom: 3.25rem;
        padding: 0;
        border: none;
    }

    .indicateursTitle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .last-button {
        margin-top: 6rem;
        display: flex;
        justify-content: center;
    }
</style>

<section>
    <form>
        <LabeledTextInput bind:value={data.custom_id}
                          hint="ex: 1.2.3, A.1.a, 1.1 permet le classement"
                          maxlength={36}
                          validator={validators.custom_id}
                          id="actionNumber">
            Numérotation de l'action
        </LabeledTextInput>

        <LabeledTextInput bind:value={data.titre}
                          hint="Ce champ est requis"
                          maxlength={300}
                          validator={validators.titre}
                          id="title">
            Titre
        </LabeledTextInput>

        <CategoriePicker ficheActionUid={data.uid}/>

        <LabeledTextArea bind:value={data.description}
                         id="description">
            Description
        </LabeledTextArea>

        <Status bind:avancementKey={data.avancement}
                id="{data.uid}"/>

        <CheckboxInput bind:value={data.en_retard}
                       validator={validators.en_retard}>
            Action en retard
        </CheckboxInput>

        <LabeledTextInput bind:value={data.structure_pilote}
                          maxlength={300}
                          validator={validators.structure_pilote}
                          id="pilote">
            Structure pilote
        </LabeledTextInput>

        <LabeledTextInput bind:value={data.personne_referente}
                          maxlength={300}
                          validator={validators.personne_referente}
                          id="personne-referente">
            Personne référente
        </LabeledTextInput>

        <LabeledTextInput bind:value={data.elu_referent}
                          maxlength={300}
                          validator={validators.elu_referent}
                          id="elu-referent">
            Élu référent
        </LabeledTextInput>

        <LabeledTextInput bind:value={data.partenaires}
                          maxlength={300}
                          validator={validators.partenaires}
                          id="partenaires">
            Partenaires
        </LabeledTextInput>

        <LabeledTextInput bind:value={data.budget} 
                          hint="Ce champ ne doit comporter que des chiffres sans espaces"
                          validator={validators.budget}
                          id="budget">
            Budget global
        </LabeledTextInput>

        <LabeledTextArea bind:value={data.commentaire}
                         id="commentaire">
            Commentaire
        </LabeledTextArea>

        <fieldset>
            <div class="calendar">
                <div>
                    <label class="fr-label" for="fiche_create_debut">Date de début</label>
                    <input bind:value={data.date_debut}
                           id="fiche_create_debut"
                           type="date"
                           class="fr-input">
                </div>

                <div>
                    <label class="fr-label" for="fiche_create_fin">Date de fin</label>
                    <input bind:value={data.date_fin}
                           id="fiche_create_fin"
                           type="date"
                           class="fr-input">
                </div>
            </div>
        </fieldset>

        <fieldset>
            <h3 class="fr-label">Actions du référentiel</h3>

            <div>
                    <LinkedActions
                        actionIds={data.referentiel_action_ids}
                        handlePickButton={toggleActionId}
                    />
                

                <button class="fr-btn fr-btn--secondary fr-btn--sm"
                        on:click|preventDefault={() => showLinkActionDialog = true }
                >
                    + Lier une action
                </button>
            </div>
        </fieldset>

        {#if indicateursReferentiel}
            <fieldset>
                <h3 class="fr-label">Indicateurs référentiel</h3>

                <MultiSelect id='fiche_create_indicateurs' bind:value={data.referentiel_indicateur_ids}>
                    {#each indicateursReferentiel as indicateur}
                        <option value="{indicateur.id}">({indicateur.id}) {indicateur.nom}</option>
                    {/each}
                </MultiSelect>

                {#each data.referentiel_indicateur_ids as indicateurId}
                <!-- TODO : Fix this once you understand what it does -->
                    <!-- {#if find(prop(indicateurId))(indicateursReferentiel) }
                        <div>
                            <IndicateurReferentielCard
                                    indicateur={find(prop(indicateurId))(indicateursReferentiel)}
                            />
                        </div>
                    {/if} -->
                {/each}
            </fieldset>
        {/if}

        <fieldset>
            <div class="indicateursTitle">
                <h3 class="fr-label">Indicateurs personnalisés</h3>

                <button on:click|preventDefault={() => showIndicateurCreation = true }
                        class="fr-btn fr-btn--secondary fr-btn--sm">
                    Créer un nouvel indicateur
                </button>
            </div>

            {#if showIndicateurCreation}
                <IndicateurPersonnaliseCreation on:save={indicateurSaved}/>
            {/if}

            {#if indicateursPersonnalises}
                <MultiSelect id='fiche_create_indicateurs' bind:value={data.indicateur_personnalise_ids}>
                    {#each indicateursPersonnalises as indicateur}
                        <option value="{indicateur.uid}">{indicateur.nom}</option>
                    {/each}
                </MultiSelect>

                {#each data.indicateur_personnalise_ids as indicateurId}
                    <IndicateurPersonnaliseCard
                            indicateur={indicateursPersonnalises.filter((i) => i.uid === indicateurId)[0]}/>
                {/each}
            {/if}
        </fieldset>

        <div class="last-button">
            <button class="fr-btn"
                    on:click={handleSave}>
                Valider
            </button>
        </div>
    </form>

    {#if showLinkActionDialog}
            <LinkActionDialog
                              on:LinkActionDialogClose={() => showLinkActionDialog = false }
                              linkedActionIds={data.referentiel_action_ids}
                              toggleActionId={toggleActionId}
            />
    {/if}
</section>