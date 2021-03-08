<script lang="typescript">
    import Title from '../shared/Title'
    import Nav from '../shared/Nav'
    import {getUrlParameter} from '../../utils/url'
    import Button from "../shared/Button.svelte";
    import Action from "../shared/Action.svelte";
    import {actionCustomStore, mesureCustomStore} from "../../api/localStore";
    import {ActionCustomStorable} from "../../storables/ActionCustomStorable";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";

    const ecpiId = getCurrentEpciId();
    const mesureUid = getUrlParameter('mesure_uid')
    const mesureId = MesureCustomStorable.buildId(ecpiId, mesureUid)
    const mesure = mesureCustomStore.retrieveById(mesureId)


    const filterByMesureId = (
        accumulator: Array<ActionCustomStorable>,
        action: ActionCustomStorable): Array<ActionCustomStorable> => {
        if (action.mesure_id == mesureUid) {
            accumulator.push(action)
        }
        return accumulator
    }
    const updateActions = () => {
        const CustomActionStorables = actionCustomStore.retrieveAll()
        actions = CustomActionStorables.reduce(filterByMesureId, [])
    }


    let actions: Array<ActionCustomStorable>
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
                href="action_ajout.html?epci_id={ecpiId}&mesure_uid={mesure.uid}"
        />
    </header>
    {#each actions as action}
        <Action
                on:delete={updateActions}
                action={action}/>
    {/each}
</main>