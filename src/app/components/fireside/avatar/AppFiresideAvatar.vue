<script lang="ts">
import { computed, onMounted, onUnmounted, PropType, ref, toRefs, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Api } from '../../../../_common/api/api.service';
import {
	canCommunityEjectFireside,
	canCommunityFeatureFireside,
	CommunityModel,
} from '../../../../_common/community/community.model';
import AppCommunityThumbnailImg from '../../../../_common/community/thumbnail/AppCommunityThumbnailImg.vue';
import { Environment } from '../../../../_common/environment/environment.service';
import { formatNumber } from '../../../../_common/filters/number';
import { FiresideCommunityModel } from '../../../../_common/fireside/community/community.model';
import {
	$featureFireside,
	$unfeatureFireside,
	FiresideModel,
} from '../../../../_common/fireside/fireside.model';
import { showErrorGrowl } from '../../../../_common/growls/growls.service';
import AppJolticon from '../../../../_common/jolticon/AppJolticon.vue';
import AppPopper from '../../../../_common/popper/AppPopper.vue';
import { Popper } from '../../../../_common/popper/popper.service';
import AppRealmThumbnail from '../../../../_common/realm/AppRealmThumbnail.vue';
import { $gettext } from '../../../../_common/translate/translate.service';
import AppUserAvatarImg from '../../../../_common/user/user-avatar/AppUserAvatarImg.vue';
import AppChatUserOnlineStatus from '../../chat/user-online-status/AppChatUserOnlineStatus.vue';
import { showCommunityEjectFiresideModal } from '../../community/eject-fireside/modal/modal.service';
import AppFiresideAvatarBase from './AppFiresideAvatarBase.vue';

export interface FiresideAvatarEvent {
	fireside: FiresideModel;
	community: FiresideCommunityModel;
}
</script>

<script lang="ts" setup>
const props = defineProps({
	fireside: {
		type: Object as PropType<FiresideModel>,
		required: true,
	},
	hideCommunity: {
		type: Boolean,
	},
	hideRealm: {
		type: Boolean,
	},
});

const emit = defineEmits({
	eject: (_: FiresideAvatarEvent) => true,
	featured: (_: FiresideAvatarEvent) => true,
	unfeatured: (_: FiresideAvatarEvent) => true,
	expired: () => true,
});

const { fireside } = toRefs(props);

let _canEmitExpiry = true;
let _expiryCheck: NodeJS.Timer | null = null;

const isLoading = ref(false);

const community = computed(() => fireside.value.community ?? undefined);
const realm = computed(() =>
	fireside.value.hasRealms ? fireside.value.realms[0].realm : undefined
);
const title = computed(() => fireside.value.title);

const canModerate = computed(
	() =>
		!isLoading.value &&
		!fireside.value.is_draft &&
		(manageableCommunities.value.length > 0 || manageableRealms.value.length > 0)
);

const manageableCommunities = computed(() =>
	fireside.value.community_links.filter(i => canCommunityEjectFireside(i.community))
);

const manageableRealms = computed(() => fireside.value.realms.filter(i => i.realm.can_moderate));

const isFeaturedInCommunity = computed(() => {
	return (
		!!community.value &&
		manageableCommunities.value.find(i => i.community.id === community.value!.id)
			?.isFeatured === true
	);
});

onMounted(() => {
	_setupCheck();
});

onUnmounted(() => {
	_destroyExpiryCheck();
});

// Set up a watch here, so that when we refetch info about the fireside
// without recreating this component, we reset the expiry checks.
watch(fireside, _setupCheck, { deep: true });

function _setupCheck() {
	// If the fireside is unjoinable from the get go, never emit expiry.
	if (!fireside.value.isOpen()) {
		_canEmitExpiry = false;
	} else if (!import.meta.env.SSR) {
		_canEmitExpiry = true;
		_destroyExpiryCheck();
		setInterval(_checkExpiry, 1000);
	}
}

function _checkExpiry() {
	if (!_canEmitExpiry) {
		return;
	}

	if (!fireside.value.isOpen()) {
		_canEmitExpiry = false;
		emit('expired');
	}
}

function _destroyExpiryCheck() {
	if (_expiryCheck) {
		clearInterval(_expiryCheck);
		_expiryCheck = null;
	}
}

function canFeatureCommunity(community: CommunityModel) {
	return canCommunityFeatureFireside(community);
}

async function toggleFeatured(community: FiresideCommunityModel) {
	Popper.hideAll();
	if (!canFeatureCommunity(community.community)) {
		return;
	}

	const isFeaturing = !community.isFeatured;
	try {
		isLoading.value = true;
		if (isFeaturing) {
			const promise = $featureFireside(fireside.value);
			if (promise instanceof Promise) {
				await promise;
				emit('featured', { fireside: fireside.value, community });
			}
		} else {
			const promise = $unfeatureFireside(fireside.value);
			if (promise instanceof Promise) {
				await promise;
				emit('unfeatured', { fireside: fireside.value, community });
			}
		}
	} catch (_) {
		showErrorGrowl({
			message: isFeaturing
				? $gettext(`Something went wrong while featuring this fireside...`)
				: $gettext(`Something went wrong while unfeaturing this fireside...`),
		});
	}
	isLoading.value = false;
}

async function ejectFiresideFromCommunity(community: FiresideCommunityModel) {
	Popper.hideAll();
	if (!canCommunityEjectFireside(community.community)) {
		return;
	}

	const result = await showCommunityEjectFiresideModal(community, fireside.value);
	if (!result) {
		return;
	}

	try {
		isLoading.value = true;
		const response = await Api.sendRequest(
			`/web/communities/manage/eject-fireside/${community.id}`,
			result
		);
		if (response.fireside) {
			fireside.value.assign(response.fireside);
		}
		emit('eject', { fireside: fireside.value, community });
	} catch (_) {
		showErrorGrowl({
			message: $gettext('Something went wrong while ejecting this fireside...'),
		});
	}
	isLoading.value = false;
}
</script>

<template>
	<AppFiresideAvatarBase
		:avatar-media-item="fireside.user.avatar_media_item"
		:community="hideCommunity ? undefined : community"
		:realm="hideRealm ? undefined : realm"
		:is-live="!fireside.is_draft"
	>
		<template #extras>
			<AppPopper v-if="canModerate" class="-extras" popover-class="fill-darkest">
				<template #default>
					<AppJolticon icon="cog" />
				</template>

				<template #popover>
					<div class="list-group thin list-group-dark">
						<div v-for="(i, index) in manageableRealms" :key="`r-${i.id}`">
							<hr v-if="index !== 0" class="sans-margin-top" />

							<h5 class="-extras-header list-group-item has-icon">
								<div class="-img">
									<AppRealmThumbnail :realm="i.realm" />
								</div>
								{{ i.realm.name }}
							</h5>

							<a
								class="list-group-item has-icon"
								:href="`${Environment.baseUrl}/moderate/realms/eject-fireside/${i.id}`"
								target="_blank"
							>
								<AppJolticon icon="eject" />
								{{ $gettext(`Eject fireside`) }}
							</a>

							<a
								class="list-group-item has-icon"
								:href="`${Environment.baseUrl}/moderate/realms/uneject-fireside/${i.id}`"
								target="_blank"
							>
								<AppJolticon icon="wand" />
								{{ $gettext(`Uneject fireside`) }}
							</a>
						</div>

						<div v-for="(i, index) in manageableCommunities" :key="`c-${i.id}`">
							<hr
								v-if="index !== 0 || manageableRealms.length !== 0"
								class="sans-margin-top"
							/>

							<h5 class="-extras-header list-group-item has-icon">
								<div class="-img">
									<AppCommunityThumbnailImg :community="i.community" />
								</div>
								{{ i.community.name }}
							</h5>

							<a
								v-if="canFeatureCommunity(i.community)"
								class="list-group-item has-icon"
								@click="toggleFeatured(i)"
							>
								<AppJolticon icon="star" />
								{{
									i.isFeatured
										? $gettext(`Unfeature fireside`)
										: $gettext(`Feature fireside`)
								}}
							</a>

							<a
								class="list-group-item has-icon"
								@click="ejectFiresideFromCommunity(i)"
							>
								<AppJolticon icon="eject" />
								{{ $gettext(`Eject fireside`) }}
							</a>
						</div>
					</div>
				</template>
			</AppPopper>
		</template>

		<template #avatar>
			<AppUserAvatarImg :user="fireside.user" />
		</template>

		<template #tag>
			<div>
				<AppJolticon v-if="isFeaturedInCommunity" icon="star" />

				{{ fireside.is_draft ? $gettext(`PRIVATE`) : $gettext(`LIVE`) }}
			</div>
		</template>

		<template #title>
			{{ title }}
		</template>

		<template #link>
			<AppPopper trigger="hover" no-hover-popover>
				<template #default>
					<RouterLink class="-link" :to="fireside.routeLocation" />
				</template>

				<template #popover>
					<div class="-tooltip">
						<div class="-tooltip-row -tooltip-members">
							<AppChatUserOnlineStatus is-online :size="12" :segment-width="1.5" />
							{{
								$ngettext(
									`%{ count } member`,
									`%{ count } members`,
									fireside.member_count,
									{ count: formatNumber(fireside.member_count || 0) }
								)
							}}
						</div>

						<hr />

						<div class="-tooltip-row -tooltip-user">
							{{ $gettext(`by`) + ' ' }}
							<AppUserAvatarImg class="-tooltip-img-user" :user="fireside.user" />
							{{ ' ' + `@${fireside.user.username}` }}
						</div>

						<div v-if="community || realm" class="-tooltip-row -tooltip-muted">
							{{ $gettext(`in`) }}
							<template v-if="realm">
								<div class="-tooltip-img-realm">
									<AppRealmThumbnail :realm="realm" not-rounded />
								</div>
								{{ realm.name }}

								<template v-if="community">
									{{ ' ' + $gettext(`and`) + ' ' }}
								</template>
							</template>

							<template v-if="community">
								<div class="-tooltip-img-community">
									<AppCommunityThumbnailImg :community="community" />
								</div>
								{{ community.name }}
							</template>
						</div>
					</div>
				</template>
			</AppPopper>
		</template>
	</AppFiresideAvatarBase>
</template>

<style lang="stylus" scoped>
@import './common'
</style>
