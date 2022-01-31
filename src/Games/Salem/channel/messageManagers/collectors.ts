import guidebook from '../../archive/guide';
import { MessageReaction, User } from 'discord.js';
import MessageManager from './messageManager';

interface Params { messageManager: MessageManager }

export interface ReactCollector {
  ({ messageManager }: Params) : Promise<void>
}

export const playerRole: ReactCollector = async ({messageManager}) => {

  const manager = messageManager;
  const message = messageManager.getMessage();
  
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

export const guide: ReactCollector = async ({messageManager}) => {
  
  const manager = messageManager;
  const message = manager.getMessage();

  manager.setMaxPage(guidebook.pages.length);

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

  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter,dispose:true});

  collector.on('collect', async (reaction, user) => {
    const userReactions = message.reactions.cache.filter(r => r.emoji.name !== reaction.emoji.name);
    userReactions.map(r => r.users.remove(user.id));
    switch(reaction.emoji.name){
      case "🙅": return game.pushJudgement({judge:player, choice:'Guilty'});
      case "🙆‍♂️": return game.pushJudgement({judge:player, choice:'Innocent'});
    }
  });

  collector.on('remove', async (reaction) => {
    switch(reaction.emoji.name){
      case "🙆‍♂️": return game.pushJudgement({judge: player, choice: 'Abstain'});
      case "🙅": return game.pushJudgement({judge: player, choice: 'Abstain'});
    }
  });

  await message.react('🙆‍♂️').catch();
  await message.react('🙅').catch();
}