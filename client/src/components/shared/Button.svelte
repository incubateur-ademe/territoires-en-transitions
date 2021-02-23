<script lang="typescript">
	enum colorVariants {
		nettle,
		bramble,
	}

	enum sizes {
	  normal,
	  small,
	}
  export let label = ''
  export let full = false
  export let classNames = ''
  export let colorVariant = 'nettle'
  export let size = 'normal'

  let buttonClassNames = ''

  /**
   * Color variants
   */
  if (colorVariant == 'nettle') {
  	buttonClassNames +=
  	' border-green-700 border-2 hover:bg-green-100 active:bg-green-600'
  }

  if (colorVariant == 'bramble') {
  	buttonClassNames +=
  	' border-gray-800 border hover:bg-green-100 active:bg-green-600'
  }

  /**
   * Size variants
   */
	if (size == 'normal') {
  	buttonClassNames += 'px-6 py-3'
	}

  if (size == 'small') {
  	buttonClassNames += ' text-base px-3 py-3'
  }
</script>

<button
  on:click
  class:w-full={full}
  class="
  	{buttonClassNames}
  	{classNames ? ` ${classNames}` : ''}"
 >
  {label}
</button>
