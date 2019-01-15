RocketChat.Migrations.add({
	version: 138,
	up() {
		RocketChat.models.Users.setAllUsersMood('uncertain');
	},
});
