<script lang="ts">
  import { theme } from '../routes/store'
  export let title: "A"|"B"
  const toggleTheme = () => {
    $theme = $theme === 'dark' ? 'light' : 'dark'

    document.querySelector('html').classList.toggle('dark')
  }
</script>
<h1>{title}</h1>
<button on:click={toggleTheme}> Toggle Theme </button>
