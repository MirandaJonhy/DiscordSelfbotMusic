const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "pause",
    description: "Para pausar uma musica tocando na queue.",
    usage: "[pause]",
    aliases: ["pause"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
	    try{
      serverQueue.connection.dispatcher.pause()
	  } catch (error) {
        message.client.queue.delete(message.guild.id);
        return sendError(`:notes: O player parou e a queue será limpada.: ${error}`, message.channel);
      }	    
      let xd = new MessageEmbed()
      .setDescription("⏸ Musica pausada!")
      .setColor("YELLOW")
      .setTitle("A musica está pausada!")
      return message.channel.send(xd);
    }
    return sendError("Não há nada tocando na queue.", message.channel);
  },
};
