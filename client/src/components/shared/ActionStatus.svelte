<script lang="ts">
  import {ActionStatus} from '../../api/actionStatus'
  import {retrieve, retrieveAll, store} from '../../api/store'
  import {v4 as uuid} from 'uuid'

  export let actionId

  let avancements = [
    {
      key: 'faite',
      label: 'Faite',
    },
    {
      key: 'programme',
      label: 'Programmée',
    },
    {
      key: 'pas_faite',
      label: 'Pas faite',
    },
    {
      key: 'non_concernee',
      label: 'Non concernée',
    }
  ]

  let classes = [
    'border rounded-l flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
    'border-t border-r border-b flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
    'border-t border-r border-b flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
    'border-t border-r border-b rounded-r flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
  ]

  const allActionStatuses = retrieveAll<ActionStatus>('action_statuses')
  const filterByActionId = (actionStatus: ActionStatus): boolean => {
    return actionStatus.action_id == actionId
  }

  let actionAvancementKey: string = 'pas_faite'
  const savedActionStatus: ActionStatus =
    Object.values(allActionStatuses).filter(filterByActionId)[0]

  if (savedActionStatus) {
    actionAvancementKey = savedActionStatus.avancement
  }


  const handleChange = (event: Event): void => {
    const avancement: ActionStatus = {
      id: uuid(),
      action_id: actionId,
      avancement: actionAvancementKey
    }

    store('action_statuses', avancement)
  }
</script>

<form class="lg:col-span-3 lg:col-end-12">
  <fieldset class="flex status" data-action-id="{actionId}">
    {#each avancements as avancement, index}
      <div>
        <input
          bind:group={actionAvancementKey}
          on:change={handleChange}
          value="{avancement.key}"
          id="action-{actionId}_{avancement.key}"
          name="action-{actionId}_status"
          type="radio"
          class="sr-only"
        >
        <label
          for="action-{actionId}_{avancement.key}"
          class={classes[index]}
        >
          { avancement.label }
        </label>
      </div>
    {/each}
  </fieldset>
</form>
