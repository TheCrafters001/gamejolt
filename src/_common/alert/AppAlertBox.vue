<script lang="ts" setup>
import { PropType } from 'vue';
import AppJolticon, { Jolticon } from '../jolticon/AppJolticon.vue';

defineProps({
	icon: {
		type: String as PropType<Jolticon>,
		default: undefined,
	},
	color: {
		type: String as PropType<'default' | 'primary'>,
		default: 'default',
	},
	fillColor: {
		type: String as PropType<'backdrop' | 'offset' | 'bg'>,
		default: 'backdrop',
	},
});
</script>

<template>
	<div class="-alert-box" :class="[`fill-${fillColor}`]">
		<div v-if="icon" class="-icon" :class="`-icon-color-${color}`">
			<AppJolticon :icon="icon" />
		</div>
		<div class="-content">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.-alert-box
	rounded-corners()
	display: flex
	flex-direction: row
	align-items: center
	padding: 24px
	grid-gap: 16px

.-content
	font-size: $font-size-small

.-icon .jolticon
	font-size: 24px

.-icon-color-default
	color: var(--theme-fg-muted)

.-icon-color-primary
	color: var(--theme-primary)
</style>
