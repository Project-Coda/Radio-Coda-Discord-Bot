const { Client } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const env = require('./env.js');
const figlet = require('figlet');
const ytdl = require('ytdl-core');
const client = new Client({
	disableEveryone: true,
	intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
});
client.login(env.discord.token);
client.once('ready', async () => {
	figlet('RADIO CODA', (err, data) => {
		if (err) {
			console.log('Something went wrong...');
			console.dir(err);
			return;
		}
		console.log(data);
	});
	player = createAudioPlayer(client, {
		NoSubscriberBehavior: NoSubscriberBehavior.Pause,

	});
	channel = client.channels.cache.get(env.discord.vc);
	const connection = joinVoiceChannel({
		channelId: env.discord.vc,
		guildId: env.discord.guild,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	async function LoadStream() {
		info = await ytdl.getInfo(env.coda.stream_url);
		format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' }).url;
		console.log(format);
		console.log('Adding Stream Resource');
		resource = createAudioResource(format);
		console.log('Loaded Stream');
		PlayStream();
	}

	async function PlayStream() {
		console.log('Playing Stream');
		player.play(resource);
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
	reset();
});