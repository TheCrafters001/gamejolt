<script lang="ts">
import { mixins, Options } from 'vue-property-decorator';
import { Api } from '../../../../_common/api/api.service';
import { Connection } from '../../../../_common/connection/connection-service';
import { BaseForm, FormOnSubmit } from '../../../../_common/form-vue/form.service';

class Wrapper extends BaseForm<any> {}

@Options({})
export default class FormRetrieveLogin extends mixins(Wrapper) implements FormOnSubmit {
	invalidEmail = false;

	readonly Connection = Connection;

	created() {
		this.form.warnOnDiscard = false;
	}

	onChanged() {
		this.invalidEmail = false;
	}

	async onSubmit() {
		const response = await Api.sendRequest('/web/auth/retrieve', this.formModel);

		if (response.success === false) {
			if (response.reason && response.reason === 'invalid-email') {
				this.invalidEmail = true;
			}
		}

		return response;
	}
}
</script>

<template>
	<AppForm :controller="form">
		<fieldset :disabled="Connection.isClientOffline ? 'true' : undefined">
			<AppFormGroup name="email" :label="$gettext('Email or Username')" hide-label>
				<p class="help-block">
					<AppTranslate>
						Enter the email address or username on your account and we'll send you a
						link to get into your account.
					</AppTranslate>
				</p>

				<AppFormControl
					type="text"
					validate-on-blur
					:placeholder="$gettext('Email or Username')"
					@changed="onChanged"
				/>

				<AppFormControlErrors />
			</AppFormGroup>

			<br />

			<div
				v-if="invalidEmail"
				v-translate
				class="alert alert-notice anim-fade-in-enlarge no-animate-leave"
			>
				<p>
					Hmm, we couldn't find you in our system. Maybe you didn't
					<a href="/join">sign up yet</a>?
				</p>
			</div>

			<AppFormButton block>
				<AppTranslate>Send Login Link</AppTranslate>
			</AppFormButton>
		</fieldset>
	</AppForm>
</template>
