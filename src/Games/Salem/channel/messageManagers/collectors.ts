import { Interaction, MessageReaction, User } from 'discord.js';
import MessageManager from './messageManager';
import { createChoices } from '../../../../Helpers/toolbox';

interface Params { messageManager: MessageManager }

export interface ReactCollector {
  ({ messageManager }: Params) : Promise<void>
}

export const playerRole: ReactCollector = async ({messageManager}) => {

  const manager = messageManager;
  const message = messageManager.getMessage();
  if(!message) return

  await message.react('🔱');
  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter});

  const updatePageNumber = async (reaction: MessageReaction)=>{
    await message.reactions.removeAll();
    if( reaction.emoji.name == '↩️'  ) { message.react('🔱'); return manager.pagePrev(); }
    if( reaction.emoji.name == '🔱'  ) { message.react('↩️'); return manager.pagePrev(); }
  }

  collector.on('remove', async (reaction) => updatePageNumber(reaction));
  collector.on('collect', async (reaction) => updatePageNumber(reaction));
}

export const welcome: ReactCollector = async ({messageManager}) => {
  
  const manager = messageManager;
  const message = manager.getMessage();

  if(!message) return

  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter,dispose:true});

  const updatePageNumber = (reaction: MessageReaction)=>{
    if( reaction.emoji.name == '⬅️' ) return manager.pagePrev();
    if( reaction.emoji.name == '➡️' ) return manager.pageNext();
  }

  collector.on('collect', async (reaction) => updatePageNumber(reaction));
  collector.on('remove', async (reaction) => updatePageNumber(reaction));

  await message.react('⬅️');
  await message.react('➡️');

}

export const judgement: ReactCollector = async ({messageManager}) => {
  const manager = messageManager;
  const game = manager.getGame();
  const player = manager.getPlayer();
  const message = manager.getMessage(); 
  if(!message) return
  const embed = manager.generateEmbed();
  const choices = createChoices({choices:['Guilty', 'Innocent', 'Abstain']})

  message.edit({ embeds:[embed], components:[choices] });

  const filter = (i:Interaction) => i.user.id === player.getId();
  const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON' });

  collector.on('collect', async (i) => {
    i.deferUpdate()
    const choice = i.customId;
    if(choice === 'Abstain' || choice === 'Innocent' || choice==='Guilty'){
      game.pushJudgement({judge:player, choice});
      player.setJudgement(choice);
    }
    return
  });

}