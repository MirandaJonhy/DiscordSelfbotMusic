const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error")

module.exports = {
  info: {
    name: "nowplaying",
    description: "Para mostrar que musica está tocando na queue.",
    usage: "",
    aliases: ["np", "tocando"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError("Não há nada tocando nesse servidor.", message.channel);
    let song = serverQueue.songs[0]
    let thing = new MessageEmbed()
      .setAuthor("Now Playing", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
      .setThumbnail(song.img)
      .setColor("BLUE")
      .addField("Nome: ", song.title, true)
      .addField("Duração: ", song.duration, true)
      .addField("Pedido por: ", song.req.tag, true)
      .setFooter(`Views: ${song.views} | ${song.ago}`)
    return message.channel.send(thing)
  },
};
