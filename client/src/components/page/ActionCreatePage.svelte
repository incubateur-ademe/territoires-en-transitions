<script lang="typescript">
    import Button from '../shared/Button'
    import {getUrlParameter} from "../../utils/url";
    import {store} from "../../api/store"
    import {v4 as uuid} from 'uuid'
    import {CustomAction} from "../../api/customAction";

    let name = ''
    let description = ''
    let mesureId = getUrlParameter('mesure_id');

    function handleSave() {
        let action: CustomAction = {
            id: uuid(),
            mesureId: mesureId,
            description: description,
            name: name,
        };
        store('custom_action', action);
        window.location.href = `/mesure_personnalisee.html?id=${mesureId}`
    }
</script>

<section class="flex flex-col">
    <h1 class="text-4xl font-semibold pb-20">Ajouter une action</h1>
    <div class="flex flex-col w-full md:w-3/4 pb-10">
        <label for="mesure_create_name">Nom</label>
        <input id="mesure_create_name"
               bind:value={name}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>
        <label for="mesure_create_description">Description</label>
        <input id="mesure_create_description"
               bind:value={description}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
    </div>

    <Button
            full
            label="Valider"
            on:click={handleSave}
            classNames="md:w-1/3 self-end"
    />
</section>
