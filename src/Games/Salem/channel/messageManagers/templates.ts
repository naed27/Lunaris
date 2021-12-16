import Game from '../../game';
import Player from '../../player';
import guidebook from '../../guide';
import { createEmbed } from '../../../../Helpers/toolbox';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import MessageManager from './messageManager';

export const clockEmbed = ({game}:{game:Game}) => {
  const clock = game.getClock();
  const phase = clock.getPhase();
  const secondsRemaining = clock.getSecondsRemaining();
  const title = `Clock`;
  const description = `Phase: ${phase}\nSeconds Remaining: ${secondsRemaining}`
  return createEmbed({title,description})
}

export const  judgementEmbed = ({player, game, votes}:{player:Player, game:Game, votes:string[]}) => {
  const title = `⚖️ The Judgement`
  const options = (player.isAlive()) ? `\n\n🙆‍♂️ - Innocent\n🙅 - Guilty` : ``;
  const voteString = votes.join(`\n`);
  const description = `**Accused: ${game.getVotedUp().getUsername()}**\n\n${voteString}\n\n${options}`
  return createEmbed({ title, description });
}

export const guideEmbed = ({pageNumber}:{pageNumber: number}) => {
  const description = guidebook.pages[pageNumber-1];
  const footer = `Page ${pageNumber} of ${guidebook.pages.length}`;
  return createEmbed({ description, footer });
}

export const guideReactCollector = async ({messageManager}:{messageManager:MessageManager}) => {
  let page = messageManager.getPage();
  const message = messageManager.getMessage();

  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter,dispose:true});

  const updatePageNumber = (reaction: MessageReaction)=>{
    const pageStart = 1;
    const pageEnd = guidebook.pages.length;
    if( reaction.emoji.name == '⬅️' && page > pageStart ) return pageUpdater(page--);
    if( reaction.emoji.name == '➡️' && page < pageEnd ) return pageUpdater(page++);
  }
  
  collector.on('collect', async (reaction) => updatePageNumber(reaction));
  collector.on('remove', async (reaction) => updatePageNumber(reaction));

  await message.react('⬅️');
  await message.react('➡️');

  const pageUpdater = (page:number) => message.edit({embeds:[ guideEmbed({pageNumber:page}) ]})
}