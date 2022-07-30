const { Client, GatewayIntentBits, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const env = require('./env.js');
const figlet = require('figlet');
const express = require('express');
const pkg = require('./package.json');
const app = express();
const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
const escape = require('escape-html');
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});
console.log(figlet.textSync('RADIO CODA',
	{
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default',
	}));
console.log(`Version: ${pkg.version}`);
console.log(`Author: ${pkg.author}`);
console.log(`GitHub: ${pkg.repository.url}`);

// register slash commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	console.log(`Loading command ${file}...`);
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}
const rest = new REST({ version: '9' }).setToken(env.discord.token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(env.discord.clientId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	}
	catch (error) {
		console.error(error);
	}
})();

client.login(env.discord.token);
client.once('ready', async () => {
	console.log('Ready!');
	player = createAudioPlayer(client, {
		NoSubscriberBehavior: NoSubscriberBehavior.Pause,

	});
	channel = client.channels.cache.get(env.discord.vc);

	async function LoadStream() {

		console.log('Adding Stream Resource');
		resource = createAudioResource(env.radio.url);
		console.log('Loaded Stream');
		PlayStream();
	}

	async function PlayStream() {
		console.log('Playing Stream');
		player.play(resource);
		connection = joinVoiceChannel({
			channelId: env.discord.vc,
			guildId: env.discord.guild,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		connection.subscribe(player);
		console.log('Stream Playing');
	}

	async function reset() {
		console.log('Resetting Stream');
		await LoadStream();
		console.log('Stream Reset');
		PlayStream();
	}

	client.once('reconnecting', () => {
		console.log('Reconnecting!');
	});
	client.once('disconnect', () => {
		console.log('Disconnect!');
	});
	player.on(AudioPlayerStatus.Idle, () => {
		console.log('Idle!');
		reset();
	});
	app.use(bodyParser.json());
	app.post('/', (req, res) => {
		console.log('Received Request');
		// Set activity based on request
		client.user.setActivity(req.body.now_playing.song.text);
		res.send('Set status to' + escape(req.body.now_playing.song.text));
		console.log('Set status to ' + req.body.now_playing.song.text);
	},
	);
	app.listen(port, () => console.log(`Now Playing API listening on port ${port}!`));

	await reset();
	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			console.log('Attempting to reconnect');
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
		}
		catch (error) {
			console.log('Disconnected!');
			connection.destroy();
		}
	},
	);
	connection.on(VoiceConnectionStatus.Destroyed, async () => {
		console.log('Connection Destroyed!');
		reset();
	},
	);
});
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(interaction.commandName);
	const commandFile = `./commands/${interaction.commandName}.js`;
	if (!fs.existsSync(commandFile)) return;
	const command = require(commandFile);
	await command.execute(interaction);
});