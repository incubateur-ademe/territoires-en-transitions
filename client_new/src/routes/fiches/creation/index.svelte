<script lang="ts">
    import {v4 as uuid} from 'uuid'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {FicheActionInterface} from "../../../../generated/models/fiche_action";
    import Form from "../_Form"

    let data: FicheActionInterface = {
        epci_id: '',
        uid: uuid(),
        custom_id: '',
        avancement: 'pas_faite',
        titre: '',
        referentiel_action_ids: [],
        referentiel_indicateur_ids: [],
        description: '',
        budget: 0,
        porteur: '',
        commentaire: '',
        date_debut: '',
        date_fin: '',
    }

    onMount(async () => {
        data.epci_id = getCurrentEpciId()

        const urlParams = new URLSearchParams(window.location.search)
        const actionId = urlParams.get('action_id')

        if (actionId) {
            data.referentiel_action_ids.push(actionId)
        }
    });


</script>


<svelte:head>
    <title>Nouvelle fiche</title>
</svelte:head>

<div class="bg-white p-4">
    <h1 class="text-4xl font-semibold pb-20">Ajouter une fiche action</h1>
    <Form bind:data="{data}"/>
</div>