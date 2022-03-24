import { Message, MessageActionRow, MessageSelectMenu, Interaction, MessageButton } from "discord.js";
import { createChoices, createMenu } from "../Helpers/toolbox";

export async function test(message:Message) {
    const msg = message.content.toLowerCase();
    const channel = message.channel;
    const author = message.author;

    const linebreak = `‎\n`

    const result = `${linebreak}${'ayayay'}`;
    const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven' , 'eight', 'nine', 'ten'];

    const numbersMenu = createMenu({
        customId: `test_menu`,
        placeHolder: `Number Picker`,
        choices: numbers.map((number) => ({ label:number, value: number }))
      })

    const buttonsMenu = createChoices({choices:['button one','button two']})
    
    const address = await channel.send({components:[numbersMenu,buttonsMenu]});


}