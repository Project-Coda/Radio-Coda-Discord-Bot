const { SlashCommandBuilder } = require('@discordjs/builders');
const pkg = require('../package.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('version')
		.setDescription('Get the version of the bot'),
	async execute(interaction) {
		interaction.reply({
			embeds: [{
				title: 'Version Information',
				description: `**Radio Coda**\n**Ping:** ${global.client.ws.ping}ms\n**Version:** ${pkg.version}\n**Author:** ${pkg.author}\n**GitHub:** ${pkg.repository.url}\n**Bug Reports:** ${pkg.bugs.url}`,
				color: 0x19ebfe,
			}], ephemeral: true,
		});
	},
};