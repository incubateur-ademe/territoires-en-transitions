<script lang="typescript">
    export let name = ''
    export let classNames
</script>

<h1
  class="text-3xl font-semibold { classNames ? ` ${classNames}` : ''}"
>
  { name }
</h1>