import { Message } from 'discord.js';
import Game from '../Games/Another/game/game';
import AnotherServer from '../Servers/AnotherServer';

export function initializeAnother(message:Message,server:AnotherServer){
  
  if(!server.connectGuild(message.guild.id))return;

  const game = new Game(message,server);
  server.pushGame(game);
  game.getHost().listenForPlayers();

}