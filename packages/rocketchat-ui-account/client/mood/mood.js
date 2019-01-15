import { Template } from 'meteor/templating';

Template.mood.helpers({
	mood() {
		const { mood : icon } = this;
		return { svg: `rc-icon rc-popover__icon-element rc-popover__icon-element--${ icon }`, icon };
	},
});
