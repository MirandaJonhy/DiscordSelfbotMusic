const { Util, MessageEmbed } = require("discord.js-self");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const ytdlDiscord = require("ytdl-core-discord");
var ytpl = require("ytpl");
const sendError = require("../util/error");
const fs = require("fs");
const scdl = require("soundcloud-downloader").default;
module.exports = {
    info: {
        name: "playlist",
        description: "Para tocar playlists",
        usage: "<YouTube Playlist URL | Playlist Name>",
        aliases: ["pl"],
    },

    run: async function (client, message, args) {
        const channel = message.member.voice.channel;
        if (!channel) return sendError("Você precisa estar em uma call para poder usar este comando!", message.channel);
        const url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";
        var searchString = args.join(" ");
        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return sendError("Eu não posso conectar nesse canal, verifique se tenho permissões suficientes para entrar neste canal.", message.channel);
        if (!permissions.has("SPEAK")) return sendError("Eu não posso falar nesse canal, verifique se tenho permissões suficientes para falar nesse canal", message.channel);

        if (!searchString || !url) return sendError(`Uso: ${message.client.config.prefix}playlist <YouTube Playlist URL | Playlist Name>`, message.channel);
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            try {
                const playlist = await ytpl(url.split("list=")[1]);
                if (!playlist) return sendError("Playlist não encontrada", message.channel);
                const videos = await playlist.items;
                for (const video of videos) {
                    // eslint-disable-line no-await-in-loop
                    await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                }
                return message.channel.send({
                    embed: {
                        color: "GREEN",
                        description: `✅  **|**  Playlist: **\`${videos[0].title}\`** foi adicionada a queue.`,
                    },
                });
            } catch (error) {
                console.error(error);
                return sendError("Playlist não encontrada :(", message.channel).catch(console.error);
            }
        } else {
            try {
                var searched = await yts.search(searchString);

                if (searched.playlists.length === 0) return sendError("Não consigo tocar essa playlist do Youtube. [Verifique a visibilidade da playlist]", message.channel);
                var songInfo = searched.playlists[0];
                let listurl = songInfo.listId;
                const playlist = await ytpl(listurl);
                const videos = await playlist.items;
                for (const video of videos) {
                    // eslint-disable-line no-await-in-loop
                    await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                }
                let thing = new MessageEmbed()
                    .setAuthor("Playlist adicionada na queue.", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                    .setThumbnail(songInfo.thumbnail)
                    .setColor("GREEN")
                    .setDescription(`✅  **|**  Playlist: **\`${songInfo.title}\`** foi adicionado \`${songInfo.videoCount}\` videos para queue.`);
                return message.channel.send(thing);
            } catch (error) {
                return sendError("Um erro não esperado aconteceu.", message.channel).catch(console.error);
            }
        }

        async function handleVideo(video, message, channel, playlist = false) {
            const serverQueue = message.client.queue.get(message.guild.id);
            const song = {
                id: video.id,
                title: Util.escapeMarkdown(video.title),
                views: video.views ? video.views : "-",
                ago: video.ago ? video.ago : "-",
                duration: video.duration,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                img: video.thumbnail,
                req: message.author,
            };
            if (!serverQueue) {
                const queueConstruct = {
                    textChannel: message.channel,
                    voiceChannel: channel,
                    connection: null,
                    songs: [],
                    volume: 80,
                    playing: true,
                    loop: false,
                };
                message.client.queue.set(message.guild.id, queueConstruct);
                queueConstruct.songs.push(song);

                try {
                    var connection = await channel.join();
                    queueConstruct.connection = connection;
                    play(message.guild, queueConstruct.songs[0]);
                } catch (error) {
                    console.error(`Eu não posso conectar nesse canal: ${error}`);
                    message.client.queue.delete(message.guild.id);
                    return sendError(`Eu não posso conectar nesse canal: ${error}`, message.channel);
                }
            } else {
                serverQueue.songs.push(song);
                if (playlist) return;
                let thing = new MessageEmbed()
                    .setAuthor("Song has been added to queue", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                    .setThumbnail(song.img)
                    .setColor("YELLOW")
                    .addField("Nome:", song.title, true)
                    .addField("Duração:", song.duration, true)
                    .addField("Pedido por:", song.req.tag, true)
                    .setFooter(`Views: ${song.views} | ${song.ago}`);
                return message.channel.send(thing);
            }
            return;
        }

        async function play(guild, song) {
            const serverQueue = message.client.queue.get(message.guild.id);
            if (!song) {
                sendError(
                    "Sai da call já que não há musicas na queue. Caso queira deixar o bot tocando musicas 24/7, vá para `commands/play.js` e remove a linha 121 \n\n Obrigado por me escolher \:)",
                    message.channel
                );
                message.guild.me.voice.channel.leave(); //If you want your bot stay in vc 24/7 remove this line :D
                message.client.queue.delete(message.guild.id);
                return;
            }
            let stream = null;
            let streamType;

            try {
                if (song.url.includes("soundcloud.com")) {
                    try {
                        stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, client.config.SOUNDCLOUD);
                    } catch (error) {
                        stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, client.config.SOUNDCLOUD);
                        streamType = "unknown";
                    }
                } else if (song.url.includes("youtube.com")) {
                    stream = await ytdl(song.url, { quality: "highestaudio", highWaterMark: 1 << 25, type: "opus" });
                    stream.on("error", function (er) {
                        if (er) {
                            if (serverQueue) {
                                serverQueue.songs.shift();
                                play(serverQueue.songs[0]);
                                return sendError(`Um erro não esperado aconteceu.\nPossivel erro: \`${er}\``, message.channel);
                            }
                        }
                    });
                }
            } catch (error) {
                if (serverQueue) {
                    console.log(error);
                    serverQueue.songs.shift();
                    play(serverQueue.songs[0]);
                }
            }
            serverQueue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
            const dispatcher = serverQueue.connection.play(stream).on("finish", () => {
                const shiffed = serverQueue.songs.shift();
                if (serverQueue.loop === true) {
                    serverQueue.songs.push(shiffed);
                }
                play(guild, serverQueue.songs[0]);
            });

            dispatcher.setVolume(serverQueue.volume / 100);
            let thing = new MessageEmbed()
                .setAuthor("Começando a tocar!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("BLUE")
                .addField("Nome:", song.title, true)
                .addField("Duração:", song.duration, true)
                .addField("Pedido por:", song.req.tag, true)
                .setFooter(`Views: ${song.views} | ${song.ago}`);
            serverQueue.textChannel.send(thing);
        }
    },
};
