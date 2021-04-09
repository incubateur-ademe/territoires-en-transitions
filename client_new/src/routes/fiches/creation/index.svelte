<script lang="ts">
    import {v4 as uuid} from 'uuid'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {FicheActionStorable} from "../../../storables/FicheActionStorable";
    import {ficheActionStore} from "../../../api/localStore";
    import Button from "../../../components/shared/Button.svelte";
    import {requiredValidator} from "../../../validation/validators"
    import {createFieldValidator} from "../../../validation/validation"
    import {FicheActionInterface} from "../../../../generated/models/fiche_action";
    import Form from "../_Form"

    let data: FicheActionInterface = {
        epci_id: '',
        uid: uuid(),
        custom_id: '',
        avancement: 'pas_faite',
        titre: '',
        referentiel_action_ids: [],
        description: '',
        budget: 0,
        porteur: '',
        commentaire: '',
        date_debut: '',
        date_fin: '',
    }

    onMount(async () => {
        data.epci_id = getCurrentEpciId()
    });


</script>


<svelte:head>
    <title>Nouvelle fiche</title>
</svelte:head>

<h1 class="text-4xl font-semibold pb-20">Ajouter une fiche action</h1>
<Form bind:data="{data}"/>