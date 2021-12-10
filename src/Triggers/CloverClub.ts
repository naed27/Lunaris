import { Message, TextChannel } from 'discord.js';
import Game from '../Games/CloverClub/game';
import Host from '../Games/CloverClub/host';

import CloverClubServer from '../Servers/CloverClubServer';

export const initializeCloverClub = (message:Message,server:CloverClubServer)=>{

  if (message.channel.type === 'DM') return

  const channelSummoned:TextChannel = message.channel as TextChannel;
  const summoner = message.author;
  const guild = message.guild

  const game = new Game({
    guild: guild,
    server: server,
  });

  const host = new Host({
    initiator:summoner,
    channelSummoned:channelSummoned,
    game:game,
  })

  game.setHost(host);
  server.pushGame(game);
  
  if(server.connectGuild(message.guild))
    game.getHost().sendGameInvite(channelSummoned,summoner);
}

export const cloverclubGuide = async (message:Message) =>{

 return
}