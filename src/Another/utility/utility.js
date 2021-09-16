const util = exports;
const {MessageEmbed} = require('discord.js');
const Lwrap = `‎\n\`\`\`json\n`;
const Rwrap = `\`\`\``;


util.createEmbed = ({author='',title='',body='',footer=''})=>{
  return new MessageEmbed()
  .setColor("#000000")
  .setAuthor(`${author}`)
  .setTitle(`${title}`)
  .setDescription(`${body}`)
  .setFooter(`${footer}`);
}

util.wrap = (message)=>{
  return `${Lwrap}${message}${Rwrap}`
}