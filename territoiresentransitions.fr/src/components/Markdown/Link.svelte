<script>
  export let href = '';
  export let title = undefined;
</script>

<style>
  a {
    box-shadow: 0 1px 0 0 currentColor;
  }
</style>

<a {href} {title} rel={href.substring(0, 4) === 'http' ? 'external' : undefined}>
  <slot />
</a>
