import { Message, MessageActionRow, MessageSelectMenu, Interaction, MessageButton } from "discord.js";
import { createChoices } from "../Helpers/toolbox";

export async function test(message:Message) {
    const msg = message.content.toLowerCase();
    const channel = message.channel;
    const author = message.author;

    const linebreak = `‎\n`

    const result = `${linebreak}${'ayayay'}`;
    
    const choices = createChoices({choices:['one', 'two']});
    
    const address = await channel.send({components:[choices]});


}