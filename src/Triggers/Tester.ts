import { Message, MessageActionRow, MessageSelectMenu, Interaction, MessageButton } from "discord.js";
import { createChoices, createMenu } from "../Helpers/toolbox";

export async function test1(message:Message) {
    const msg = message.content.toLowerCase();
    const channel = message.channel;
    const author = message.author;

    const linebreak = `‎\n`

    const numbers = ['Walk', 'Run', 'Dodge', 'Jump', 'Kill', 'Sneak', 'Teleport' , 'See Stats', 'Inventory', 'Exit'];

    const numbersMenu = createMenu({
        customId: `test_menu`,
        placeHolder: `Skill Picker`,
        choices: numbers.map((number) => ({ label:number, value: number }))
      })
    
    const address = await channel.send({content:'---',components:[numbersMenu]});
}

export async function test2(message:Message) {
  const msg = message.content.toLowerCase();
  const channel = message.channel;
  const author = message.author;

  const linebreak = `‎\n`

  const menuOne = ['Walk', 'Run', 'Dodge', 'Jump', 'Kill'];
  const menuTwo = ['Sneak', 'Teleport' , 'See Stats', 'Inventory', 'Exit']


  const buttonSetOne = createChoices({choices:menuOne})
  const buttonSetTwo = createChoices({choices:menuTwo})
  
  const address = await channel.send({content:'---',components:[buttonSetOne,buttonSetTwo]});


}