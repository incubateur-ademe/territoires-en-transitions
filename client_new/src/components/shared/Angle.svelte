<script lang="ts">
    /**
     * Clickable angled arrow
     * Used to fold/unfold additional information.
     */
    type legal = 'right' | 'down' | 'left'
    const styles = new Map<legal, string>([['right', 'rotate-0'], ['down', 'rotate-90'], ['left', 'rotate-180']])
    export let direction: legal = 'right'
</script>


<button on:click|preventDefault type="button" class="focus:outline-none">
    <div class="transform  {styles.get(direction)}">
        <span class="text-2xl"><slot> > </slot></span>
    </div>
</button>