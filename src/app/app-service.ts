import { Injectable, Inject } from 'ng-metadata/core';
import { Meta } from './../lib/gj-lib-client/components/meta/meta-service';

@Injectable()
export class App
{
	ver: number = null;
	user: any = null;
	userBootstrapped = false;

	constructor(
		@Inject( '$rootScope' ) $rootScope: ng.IRootScopeService,
		@Inject( '$state' ) private $state: ng.ui.IStateService,
		@Inject( '$injector' ) private $injector: any,
		@Inject( '$q' ) private $q: ng.IQService,
		@Inject( '$document' ) private $document: ng.IDocumentService,
		@Inject( 'Chat' ) private Chat: any,
		@Inject( 'ModalConfirm' ) private ModalConfirm: any,
		@Inject( 'Growls' ) private Growls: any,
		@Inject( 'Meta' ) private meta: Meta
	)
	{
		// Payload emits this every time the user is processed.
		// We want to store whether or not we've bootstrapped the user yet so we can hide things
		// that depend on the user being loaded in.
		$rootScope.$on( 'Payload.userProcessed', _ =>
		{
			if ( !this.userBootstrapped ) {
				this.userBootstrapped = true;
			}
		} );

		// Connect to chat.
		Chat.connect();
	}

	get title() { return this.meta.title; }
	set title( title: string ) { this.meta.title = title; }

	logout()
	{
		return this.$q( ( resolve, reject ) =>
		{
			this.ModalConfirm.show( 'Are you seriously going to leave us?', 'Really?', 'yes' ).then( _ =>
			{
				// Must send POST.
				this.$injector.get( 'Api' ).sendRequest( '/web/dash/account/logout', {} ).then( _ =>
				{
					// We go to the homepage currently just in case they're in a view they shouldn't be.
					this.$state.go( 'discover.home' );

					// Log out of chat. This will notify other tabs to disconnect from the server too.
					this.Chat.client.logOut();

					this.Growls.success( 'You are now logged out.', 'Goodbye!' );
					resolve();
				} )
				.catch( err =>
				{
					console.error( err );
					this.Growls.error( 'Could not log you out.' );
					reject();
				} );
			} );
		} );
	}
}
