const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "resume",
    description: "para 'despausar' uma musica",
    usage: "",
    aliases: ["dp", "rs"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      let xd = new MessageEmbed()
      .setDescription("▶ Tocando a musica novamente!")
      .setColor("YELLOW")
      .setAuthor("Musica 'despausada'!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
      return message.channel.send(xd);
    }
    return sendError("Não há nada tocando nesse servidor.", message.channel);
  },
};
