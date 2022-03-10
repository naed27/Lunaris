import { Message, MessageActionRow, MessageSelectMenu, Interaction, MessageButton } from "discord.js";

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

    const Buttons = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('one')
					.setLabel('one')
					.setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('two')
          .setLabel('two')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('three')
          .setLabel('three')
          .setStyle('PRIMARY'),
			);
    
    const meseji = await channel.send({content:'choose one',components: [Buttons]});

    const filter = (i:Interaction) => i.user.id === author.id;
    const collector = meseji.createMessageComponentCollector({ filter, componentType: 'BUTTON' });

    collector.on('collect', async (i) => {
      i.deferUpdate()
      await meseji.edit({content:`you chose ${i.customId}`});
      return
    });

    collector.on('end', collected => {
      console.log('end')
    });	

}