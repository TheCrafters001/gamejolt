<script lang="ts" setup>
import { PropType, computed, toRefs } from 'vue';
import { styleChangeBg } from '../../../_styles/mixins';
import AppAvatarFrame from '../../avatar/AppAvatarFrame.vue';
import { AvatarFrameModel } from '../../avatar/frame.model';
import { ComponentProps } from '../../component-helpers';
import { Environment } from '../../environment/environment.service';
import { ThemeColor } from '../../theme/variables';
import AppUserVerifiedWrapper from '../AppUserVerifiedWrapper.vue';
import { UserCommonFields } from '../user.model';
import AppUserAvatarImg from './AppUserAvatarImg.vue';

const props = defineProps({
	user: {
		type: [Object, null] as PropType<UserCommonFields | null>,
		required: true,
	},
	bgColor: {
		type: String as PropType<ThemeColor>,
		default: 'bg',
	},
	disableLink: {
		type: Boolean,
	},
	/**
	 * Shows verified tick or creator badge when available.
	 */
	showVerified: {
		type: Boolean,
	},
	verifiedOffset: {
		type: Number,
		default: undefined,
	},
	verifiedSize: {
		type: String as PropType<'big' | 'small' | 'tiny'>,
		default: undefined,
	},
	verifiedPosition: {
		type: String as PropType<ComponentProps<typeof AppUserVerifiedWrapper>['position']>,
		default: undefined,
	},
	/**
	 * Shows an avatar frame around the avatar when available.
	 */
	showFrame: {
		type: Boolean,
	},
	/**
	 * Allows overriding the avatar frame to display something other than what
	 * the User has equipped.
	 */
	frameOverride: {
		type: Object as PropType<AvatarFrameModel>,
		default: undefined,
	},
	/**
	 * Allows extra inset to be added/removed from the avatar frame.
	 *
	 * Has no effect if {@link showFrame} is `false`.
	 */
	frameInset: {
		type: Number,
		validator: value => value === undefined || typeof value === 'number',
		default: undefined,
	},
	/**
	 * Treats the frame as a border that insets our avatar instead of the having
	 * the frame extend the container bounds.
	 */
	smoosh: {
		type: Boolean,
	},
});

const {
	user,
	bgColor,
	disableLink,
	showVerified,
	verifiedOffset,
	verifiedSize,
	showFrame,
	frameOverride,
	frameInset,
	smoosh,
} = toRefs(props);

const avatarFrame = computed(() => frameOverride?.value || user.value?.avatar_frame || null);
const maySmooshFrame = computed(() => !!avatarFrame.value && showFrame.value && smoosh.value);

const href = computed(() => {
	if (disableLink.value || !user.value) {
		return undefined;
	}

	return Environment.wttfBaseUrl + '/@' + user.value.username;
});
</script>

<template>
	<!-- AppUserAvatarBubble -->
	<div>
		<component :is="href ? 'a' : 'div'" :href="href">
			<AppUserVerifiedWrapper
				:user="user"
				:hide-tick="!showVerified"
				:tick-offset="verifiedOffset ?? (maySmooshFrame ? 0 : undefined)"
				:position="verifiedPosition"
				:big="verifiedSize === 'big'"
				:small="verifiedSize === 'small'"
				:tiny="verifiedSize === 'tiny'"
			>
				<AppAvatarFrame
					:frame="avatarFrame"
					:hide-frame="!showFrame"
					:inset="frameInset"
					:smoosh="smoosh"
				>
					<div
						:style="{
							...styleChangeBg(bgColor),
							borderRadius: `50%`,
							// Some containers end up adjusting the size of this avatar
							// and break things, even if width and height on the parent
							// are assigned to 1:1 ratios.
							lineHeight: 0,
						}"
					>
						<slot>
							<AppUserAvatarImg
								class="_img"
								:style="{ borderRadius: `50%` }"
								:user="user"
							/>
						</slot>
					</div>
				</AppAvatarFrame>
			</AppUserVerifiedWrapper>
		</component>
	</div>
</template>

<style lang="stylus" scoped>
._img
	&
	::v-deep(img)
		width: 100%
		height: 100%
</style>
