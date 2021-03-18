const { Util, MessageEmbed } = require("discord.js-self");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const ytdlDiscord = require("ytdl-core-discord");
const YouTube = require("youtube-sr");
const sendError = require("../util/error");
const fs = require("fs");
const scdl = require("soundcloud-downloader").default;
module.exports = {
    info: {
        name: "search",
        description: "To search songs :D",
        usage: "<song_name>",
        aliases: ["sc"],
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Você precisa estar em uma call para poder usar este comando!", message.channel);

        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return sendError("Eu não posso conectar nesse canal, verifique se tenho permissões suficientes para entrar neste canal.", message.channel);
        if (!permissions.has("SPEAK")) return sendError("Eu não posso falar nesse canal, verifique se tenho permissões suficientes para falar nesse canal.", message.channel);

        var searchString = args.join(" ");
        if (!searchString) return sendError("Você não falou algo para poder ser procurado!", message.channel);

        var serverQueue = message.client.queue.get(message.guild.id);
        try {
            var searched = await YouTube.search(searchString, { limit: 10 });
            if (searched[0] == undefined) return sendError("Não consigo procurar essa musica no Youtube.", message.channel);
            let index = 0;
            let embedPlay = new MessageEmbed()
                .setColor("BLUE")
                .setAuthor(`Resultados para \"${args.join(" ")}\"`, message.author.displayAvatarURL())
                .setDescription(`${searched.map((video2) => `**\`${++index}\`  |** [\`${video2.title}\`](${video2.url}) - \`${video2.durationFormatted}\``).join("\n")}`)
                .setFooter("Digite o numero da musica para adiciona-la na queue.");
            // eslint-disable-next-line max-depth
            message.channel.send(embedPlay).then((m) =>
                m.delete({
                    timeout: 15000,
                })
            );
            try {
                var response = await message.channel.awaitMessages((message2) => message2.content > 0 && message2.content < 11, {
                    max: 1,
                    time: 20000,
                    errors: ["time"],
                });
            } catch (err) {
                console.error(err);
                return message.channel.send({
                    embed: {
                        color: "RED",
                        description: "Nada foi selecionado em 20 segundos, a solicitação foi cancelada.",
                    },
                });
            }
            const videoIndex = parseInt(response.first().content);
            var video = await searched[videoIndex - 1];
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embed: {
                    color: "RED",
                    description: "🆘  **|**  Não consegui obter nenhum resultado de pesquisa",
                },
            });
        }

        response.delete();
        var songInfo = video;

        const song = {
            id: songInfo.id,
            title: Util.escapeMarkdown(songInfo.title),
            views: String(songInfo.views).padStart(10, " "),
            ago: songInfo.uploadedAt,
            duration: songInfo.durationFormatted,
            url: `https://www.youtube.com/watch?v=${songInfo.id}`,
            img: songInfo.thumbnail.url,
            req: message.author,
        };

        if (serverQueue) {
            serverQueue.songs.push(song);
            let thing = new MessageEmbed()
                .setAuthor("A música foi adicionada à queue", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("YELLOW")
                .addField("Nome", song.title, true)
                .addField("Duração", song.duration, true)
                .addField("Pedido por:", song.req.tag, true)
                .setFooter(`Views: ${song.views} | ${song.ago}`);
            return message.channel.send(thing);
        }

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

        const play = async (song) => {
            const queue = message.client.queue.get(message.guild.id);
            if (!song) {
                sendError(
                    "Saindo do canal de voz porque acho que não tem músicas na fila. Se você gosta do bot, fique 24 horas nos sete dias da semana no canal de voz, vá para `comandos / play.js` e remova o número da linha 121\n\nObrigado por usar esse bot \:)",
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
                            if (queue) {
                                queue.songs.shift();
                                play(queue.songs[0]);
                                return sendError(`Um erro não esperado aconteceu.\nPossível erro \`${er}\``, message.channel);
                            }
                        }
                    });
                }
            } catch (error) {
                if (queue) {
                    queue.songs.shift();
                    play(queue.songs[0]);
                }

                console.error(error);
                return message.channel.send("err");
            }

            queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
            const dispatcher = queue.connection.play(stream).on("finish", () => {
                const shiffed = queue.songs.shift();
                if (queue.loop === true) {
                    queue.songs.push(shiffed);
                }
                play(queue.songs[0]);
            });

            dispatcher.setVolumeLogarithmic(queue.volume / 100);
            let thing = new MessageEmbed()
                .setAuthor("Musica adicionada à queue!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("BLUE")
                .addField("Nome", song.title, true)
                .addField("Duração", song.duration, true)
                .addField("Pedido por:", song.req.tag, true)
                .setFooter(`Views: ${song.views} | ${song.ago}`);
            queue.textChannel.send(thing);
        };

        try {
            const connection = await channel.join();
            queueConstruct.connection = connection;
            channel.guild.voice.setSelfDeaf(true);
            play(queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Eu não posso conectar nesse canal: ${error}`);
            message.client.queue.delete(message.guild.id);
            await channel.leave();
            return sendError(`Eu não posso falar nesse canal: ${error}`, message.channel);
        }
    },
};
