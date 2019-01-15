import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { popover } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';

const setStatus = (status) => {
	AccountBox.setStatus(status);
	RocketChat.callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const setMood = (mood) => {
	const _id = Meteor.userId();

	Meteor.users.update({ _id }, {
		$set: {
			mood,
		},
	});

	popover.close();
};

const viewModeIcon = {
	extended: 'th-list',
	medium: 'list',
	condensed: 'list-alt',
};

const extendedViewOption = (user) => {
	if (RocketChat.settings.get('Store_Last_Message')) {
		return {
			icon: viewModeIcon.extended,
			name: t('Extended'),
			modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'extended' ? 'bold' : null,
			action: () => {
				Meteor.call('saveUserPreferences', { sidebarViewMode: 'extended' }, function(error) {
					if (error) {
						return handleError(error);
					}
				});
			},
		};
	}

	return;
};

const showToolbar = new ReactiveVar(false);

const selectorSearch = '.toolbar__search .rc-input__element';
toolbarSearch = {
	shortcut: false,
	clear() {
		const $inputMessage = $('.js-input-message');

		if (0 === $inputMessage.length) {
			return;
		}

		$inputMessage.focus();
		$(selectorSearch).val('');
	},
	show(fromShortcut) {
		menu.open();
		showToolbar.set(true);
		this.shortcut = fromShortcut;
	},
	close() {
		showToolbar.set(false);
		if (this.shortcut) {
			menu.close();
		}
	},
};

const toolbarButtons = (user) => [{
	name: t('Search'),
	icon: 'magnifier',
	action: () => {
		toolbarSearch.show(false);
	},
},
{
	name: t('Directory'),
	icon: 'globe',
	action: () => {
		menu.close();
		FlowRouter.go('directory');
	},
},
{
	name: t('View_mode'),
	icon: () => viewModeIcon[RocketChat.getUserPreference(user, 'sidebarViewMode') || 'condensed'],
	action: (e) => {
		const hideAvatarSetting = RocketChat.getUserPreference(user, 'sidebarHideAvatar');
		const config = {
			columns: [
				{
					groups: [
						{
							items: [
								extendedViewOption(user),
								{
									icon: viewModeIcon.medium,
									name: t('Medium'),
									modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'medium' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'medium' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
								{
									icon: viewModeIcon.condensed,
									name: t('Condensed'),
									modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'condensed' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'condensed' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
							],
						},
						{
							items: [
								{
									icon: 'user-rounded',
									name: hideAvatarSetting ? t('Show_Avatars') : t('Hide_Avatars'),
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarHideAvatar: !hideAvatarSetting }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
							],
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
},
{
	name: t('Sort'),
	icon: 'sort',
	action: (e) => {
		const options = [];
		const config = {
			template: 'sortlist',
			currentTarget: e.currentTarget,
			data: {
				options,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
},
{
	name: t('Create_A_New_Channel'),
	icon: 'edit-rounded',
	condition: () => RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p']),
	action: () => {
		menu.close();
		FlowRouter.go('create-channel');
	},
},
{
	name: t('Options'),
	icon: 'menu',
	condition: () => AccountBox.getItems().length || RocketChat.authz.hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration']),
	action: (e) => {
		let adminOption;
		if (RocketChat.authz.hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration'])) {
			adminOption = {
				icon: 'customize',
				name: t('Administration'),
				type: 'open',
				id: 'administration',
				action: () => {
					SideNav.setFlex('adminFlex');
					SideNav.openFlex();
					FlowRouter.go('admin-info');
					popover.close();
				},
			};
		}

		const config = {
			popoverClass: 'sidebar-header',
			columns: [
				{
					groups: [
						{
							items: AccountBox.getItems().map((item) => {
								let action;

								if (item.href) {
									action = () => {
										FlowRouter.go(item.href);
										popover.close();
									};
								}

								if (item.sideNav) {
									action = () => {
										SideNav.setFlex(item.sideNav);
										SideNav.openFlex();
										popover.close();
									};
								}

								return {
									icon: item.icon,
									name: t(item.name),
									type: 'open',
									id: item.name,
									href: item.href,
									sideNav: item.sideNav,
									action,
								};
							}).concat([adminOption]),
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
}];
Template.sidebarHeader.helpers({
	myUserInfo() {
		const id = Meteor.userId();

		if (id == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				username: 'anonymous',
				status: 'online',
			};
		}
		return id && Meteor.users.findOne(id, { fields: {
			username: 1, status: 1, mood: 1,
		} });
	},
	toolbarButtons() {
		return toolbarButtons(Meteor.userId()).filter((button) => !button.condition || button.condition());
	},
	showToolbar() {
		return showToolbar.get();
	},
});

Template.sidebarHeader.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	async 'click .sidebar__header-mood'(e) {

		const moodStatistic = await new Promise((res, rej) => {
			Meteor.call('getMoodStatistic', (err, statistic) => {
				if (err) {
					rej(err);
				}
				res(statistic.reduce((acc, user) => {
					acc[user._id] = user.count;
					return acc;
				}, {}));
			});
		});

		const config = {
			popoverClass: 'sidebar-header',
			columns: [
				{
					groups: [
						{
							title: t('User mood'),
							items: [
								{
									icon: 'happy',
									name: t('Happy'),
									action: () => setMood('happy'),
								},
								{
									icon: 'sad',
									name: t('Sad'),
									action: () => setMood('sad'),
								},
								{
									icon: 'uncertain',
									name: t('Uncertain'),
									action: () => setMood('uncertain'),
								},
								{
									icon: 'confused',
									name: t('Confused'),
									action: () => setMood('confused'),
								},
							],
						},
						{
							title: t('Mood statistic'),
							items: [
								{
									icon: 'happy',
									name: t(`${ moodStatistic.happy || 0 }`),
								},
								{
									icon: 'sad',
									name: t(`${ moodStatistic.sad || 0 }`),
								},
								{
									icon: 'uncertain',
									name: t(`${ moodStatistic.uncertain || 0 }`),
								},
								{
									icon: 'confused',
									name: t(`${ moodStatistic.confused || 0 }`),
								},
							],
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
	'click .sidebar__header .avatar'(e) {
		if (!(Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead'))) {
			const user = Meteor.user();
			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								title: t('User'),
								items: [
									{
										icon: 'circle',
										name: t('online'),
										modifier: 'online',
										action: () => setStatus('online'),
									},
									{
										icon: 'circle',
										name: t('away'),
										modifier: 'away',
										action: () => setStatus('away'),
									},
									{
										icon: 'circle',
										name: t('busy'),
										modifier: 'busy',
										action: () => setStatus('busy'),
									},
									{
										icon: 'circle',
										name: t('invisible'),
										modifier: 'offline',
										action: () => setStatus('offline'),
									},
								],
							},
							{
								items: [
									{
										icon: 'user',
										name: t('My_Account'),
										type: 'open',
										id: 'account',
										action: () => {
											SideNav.setFlex('accountFlex');
											SideNav.openFlex();
											FlowRouter.go('account');
											popover.close();
										},
									},
									{
										icon: 'sign-out',
										name: t('Logout'),
										type: 'open',
										id: 'logout',
										action: () => {
											Meteor.logout(() => {
												RocketChat.callbacks.run('afterLogoutCleanUp', user);
												Meteor.call('logoutCleanUp', user);
												FlowRouter.go('home');
												popover.close();
											});
										},
									},
								],
							},
						],
					},
				],
				currentTarget: e.currentTarget,
				offsetVertical: e.currentTarget.clientHeight + 10,
			};

			popover.open(config);
		}
	},
});
