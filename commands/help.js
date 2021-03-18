const { MessageEmbed } = require('discord.js-self')

module.exports = {
    info: {
        name: "help",
        description: "Todos os comandos aqui",
        usage: "[command]",
        aliases: ["commands", "help me", "pls help", "ajuda"]
    },

    run: async function(client, message, args){
        var allcmds = "";

        client.commands.forEach(cmd => {
            let cmdinfo = cmd.info
            allcmds+="`"+client.config.prefix+cmdinfo.name+" "+cmdinfo.usage+"` ~ "+cmdinfo.description+"\n"
        })

        let embed = new MessageEmbed()
        .setAuthor("Commands of "+client.user.username, "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
        .setColor("BLUE")
        .setDescription(allcmds)
        .setFooter(`Para ter informações mais completas use ${client.config.prefix}help [comando]`)

        if(!args[0])return message.channel.send(embed)
        else {
            let cmd = args[0]
            let command = client.commands.get(cmd)
            if(!command)command = client.commands.find(x => x.info.aliases.includes(cmd))
            if(!command)return message.channel.send("Comando Desconhecido")
            let commandinfo = new MessageEmbed()
            .setTitle("Comando: "+command.info.name+" info")
            .setColor("YELLOW")
            .setDescription(`
Nome: ${command.info.name}
Descrição: ${command.info.description}
Uso: \`\`${client.config.prefix}${command.info.name} ${command.info.usage}\`\`
Aliases: ${command.info.aliases.join(", ")}
`)
            message.channel.send(commandinfo)
        }
    }
}
