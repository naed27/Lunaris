import { Message, MessageActionRow, MessageSelectMenu, Interaction } from "discord.js";

export async function sendInteraction(message:Message) {
    const msg = message.content.toLowerCase();
    const channel = message.channel;
    const author = message.author;
    
    const menu = new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
      .setCustomId('idk choices')
      .setPlaceholder('Choices')
      .addOptions([
        { label: '1', value: 'One' },
        { label: '2', value: 'Two' },
      ]),
    )
    
    const meseji = await channel.send({content:'choose one',components: [menu]});

    const filter = (i:Interaction) => i.user.id === author.id;
    const collector = meseji.createMessageComponentCollector({ filter, componentType: 'SELECT_MENU' });

    collector.on('collect', async (i) => {
      i.deferUpdate()
      await meseji.edit({content:`you chose ${i.values[0]}`});
      return
    });

    collector.on('end', collected => {
      
    });	

}