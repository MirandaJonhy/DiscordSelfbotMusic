const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "remove",
    description: "Remove song from the queue",
    usage: "<number>",
    aliases: ["rm", "r"],
  },

  run: async function (client, message, args) {
   const queue = message.client.queue.get(message.guild.id);
    if (!queue) return sendError("Não tem queue para remover musicas.",message.channel).catch(console.error);
    if (!args.length) return sendError(`Uso: ${client.config.prefix}\`remove <Queue Number>\``);
    if (isNaN(args[0])) return sendError(`Uso: ${client.config.prefix}\`remove <Queue Number>\``);
    if (queue.songs.length == 1) return sendError("Não tem queue para remover musicas.",message.channel).catch(console.error);
    if (args[0] > queue.songs.length)
      return sendError(`A queue só tem ${queue.songs.length} musicas!`,message.channel).catch(console.error);
try{
    const song = queue.songs.splice(args[0] - 1, 1); 
    sendError(`❌ **|** Removida: **\`${song[0].title}\`** da queue.`,queue.textChannel).catch(console.error);
                   message.react("✅")
} catch (error) {
        return sendError(`:notes: Um erro não esperado aconteceu.\nPossivel erro: ${error}`, message.channel);
      }
  },
};
