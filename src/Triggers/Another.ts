import { Message } from 'discord.js';
import Game from '../Games/Another/game';
import Host from '../Games/Another/host';
import AnotherServer from '../Servers/AnotherServer';

export function initializeAnother(message:Message,server:AnotherServer){
  
  if(message.channel.type !== 'GUILD_TEXT') return

  const channel = message.channel;
  const summoner = message.author;
  const guild = message.guild;

  const game = new Game({ guild, server });
  const host = new Host({ game, summoner, channel })

  game.setHost(host);
  server.pushGame(game);
  
  if(server.connectGuild(message.guild))
    game.getHost().sendGameInvite({ channel, summoner });

}