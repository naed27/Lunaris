const Game = require('../../Another/game/game');

const command = exports;

command.initializeAnother = (message,server)=>{
  
  if(!server.connectGuild(message.guild.id))return;

  const game = new Game(message,server);
  server.pushGame(game);
  game.getHost().listenForPlayers(message.channel);

}