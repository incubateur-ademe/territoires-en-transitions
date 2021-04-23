<script lang="ts">
    type legal = 'right' | 'down' | 'left'
    const styles = new Map<legal, string>([['right', 'rotate-0'], ['down', 'rotate-90'], ['left', 'rotate-180']])
    export let direction: legal = 'right'
</script>


<button on:click|preventDefault type="button">
    <div class="transform  {styles.get(direction)}">
        <span class="text-2xl"><slot> > </slot></span>
    </div>
</button>