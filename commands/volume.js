const { MessageEmbed } = require("discord.js-self");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "volume",
    description: "Para alterar o volume da queue de músicas do servidor",
    usage: "[volume]",
    aliases: ["v", "vol"],
  },

  run: async function (client, message, args) {
    const channel = message.member.voice.channel;
    if (!channel)return sendError("Você precisa estar em uma call para poder usar este comando!", message.channel);
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError("Não há nada tocando na queue..", message.channel);
    if (!serverQueue.connection) return sendError("Não há nada tocando na queue.", message.channel);
    if (!args[0])return message.channel.send(`O volume atual é: **${serverQueue.volume}**`);
     if(isNaN(args[0])) return message.channel.send(':notes: Numeros apenas!').catch(err => console.log(err));
    if(parseInt(args[0]) > 150 ||(args[0]) < 0) return sendError('Você não pode definir o volume para mais de 150, ou inferior a 0',message.channel).catch(err => console.log(err));
    serverQueue.volume = args[0]; 
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
    let xd = new MessageEmbed()
    .setDescription(`Eu ajusto o volume para: **${args[0]/1}/100**`)
    .setAuthor("Gerenciador de volume do servidor", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
    .setColor("BLUE")
    return message.channel.send(xd);
  },
};
