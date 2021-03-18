const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error");

module.exports = {
    info: {
        name: "leave",
        aliases: ["goaway", "disconnect", "dc", "sair"],
        description: "Sair da Call",
        usage: "Leave",
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Você precisa estar em uma call para poder usar esse comando", message.channel);
        if (!message.guild.me.voice.channel) return sendError("Eu não estou em nenhuma call para sair :confused:", message.channel);

        try {
            await message.guild.me.voice.channel.leave();
        } catch (error) {
            await message.guild.me.voice.kick(message.guild.me.id);
            return sendError("Tentando sair da call...", message.channel);
        }

        const Embed = new MessageEmbed()
            .setAuthor("Sair da call", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
            .setColor("GREEN")
            .setTitle("Sucesso")
            .setDescription("🎶 Sai da call.")
            .setTimestamp();

        return message.channel.send(Embed).catch(() => message.channel.send("🎶 Acabei de sair da call :C"));
    },
};
