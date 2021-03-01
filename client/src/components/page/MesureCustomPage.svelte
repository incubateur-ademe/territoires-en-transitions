<script lang="typescript">
    import Title from '../shared/Title'
    import Nav from '../shared/Nav'
    import {getUrlParameter} from '../../utils/url'
    import {getCustomMesure} from '../../api/customMesure'
    import Button from "../shared/Button.svelte";
    import {retrieveAll} from "../../api/store";
    import Action from "../shared/Action.svelte";
    import {CustomAction} from "../../api/customAction";

    const id = getUrlParameter('id')
    const mesure = getCustomMesure(id)
    const filterByMesureId = (
        accumulator: Record<string, CustomAction>,
        action: CustomAction): Record<string, CustomAction> => {
        if (action.mesureId == id) {
            accumulator[action.id] = action
        }
        return accumulator
    }
    const updateActions = () => {
        const customActions =retrieveAll<CustomAction>('custom_action')
        actions = Object.values(customActions).reduce(filterByMesureId, {})
    }


    let actions: Record<string, CustomAction>
    updateActions()
</script>

<Nav/>
<main class="container mx-auto lg:px-20 px-4" id="mesure-6.5.5">
    <header class="flex my-10">
        <Title
                name={mesure.name}
                classNames="flex-grow"
        />
        <Button
                asLink
                label="Ajouter une action"
                href="action_ajout.html?mesure_id={mesure.id}"
        />
    </header>
    {#each Object.values(actions) as action}
        <Action
                id={action.id}
                name={action.name}
                on:delete={updateActions}
                description={action.description}/>
    {/each}
</main>