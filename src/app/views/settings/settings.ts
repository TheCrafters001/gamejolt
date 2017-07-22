import { Component } from 'vue-property-decorator';
import * as View from '!view!./settings.html';

import { Meta } from '../../../lib/gj-lib-client/components/meta/meta-service';
import { AppScrollAffix } from '../../../lib/gj-lib-client/components/scroll/affix/affix';
import { AppPageHeader } from '../../components/page-header/page-header';
import { User } from '../../../lib/gj-lib-client/components/user/user.model';
import { FormSettings } from '../../components/forms/settings/settings';
import { AppScrollTo } from '../../../lib/gj-lib-client/components/scroll/to/to.directive';
import {
	BaseRouteComponent,
	RouteResolve,
} from '../../../lib/gj-lib-client/components/route/route-component';

@View
@Component({
	components: {
		AppPageHeader,
		AppScrollAffix,
		FormSettings,
	},
	directives: {
		AppScrollTo,
	},
})
export default class RouteSettings extends BaseRouteComponent {
	get sections() {
		const sections: any = {};

		if (GJ_IS_CLIENT) {
			sections.client = this.$gettext('settings.client');
		}

		return {
			site: this.$gettext('Site'),
			chat: this.$gettext('settings.chat'),
			restrictions: this.$gettext('Restrictions'),
			notifications: this.$gettext('Notifications'),
		};
	}

	@RouteResolve()
	async routeResolve() {
		User.touch();
	}

	routeInit() {
		Meta.title = this.$gettext('Settings');
	}
}
