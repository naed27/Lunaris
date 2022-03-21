import { Message, MessageActionRow, MessageSelectMenu, Interaction, MessageButton } from "discord.js";

export async function test(message:Message) {
    const msg = message.content.toLowerCase();
    const channel = message.channel;
    const author = message.author;

    const linebreak = `‎\n`

    const result = `${linebreak}${'ayayay'}`;
    
    const address = await channel.send({content:result});


}