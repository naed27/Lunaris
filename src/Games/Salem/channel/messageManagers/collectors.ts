import guidebook from '../../archive/guide';
import { MessageReaction, User } from 'discord.js';
import MessageManager from './messageManager';

interface Params {
  messageManager:MessageManager
}

export const playerRole = async ({messageManager}:{messageManager:MessageManager}) => {
  const manager = messageManager;
  const message = messageManager.getMessage();
  await message.react('🔱');
  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter});

  const updatePageNumber = async (reaction: MessageReaction)=>{
    await message.reactions.removeAll();
    if( reaction.emoji.name == '↩️'  ) {message.react('🔱');return manager.pagePrev();}
    if( reaction.emoji.name == '🔱'  ) {message.react('↩️');return manager.pagePrev();}
  }

  collector.on('collect', async (reaction) => updatePageNumber(reaction));
  collector.on('remove', async (reaction) => updatePageNumber(reaction));
}

export const guide = async ({messageManager}:Params) => {
  
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