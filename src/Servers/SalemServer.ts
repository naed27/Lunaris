import { arrayContainsElement } from '../Helpers/toolbox';
import { Guild } from 'discord.js';
import Game from '../Games/Salem/game';

export default class Server{

  games: Game[] =  [];
  connectedGuilds: string[] = [];

  //--------------------- Server Functions ----------------------

  connectGuild(guild:Guild){
    const guildId = guild.id;
    
    if(arrayContainsElement(this.connectedGuilds,guildId))  // check if the guild is already playing
      return false;

    this.connectedGuilds.push(guildId);                     // if not, let the guild connect
    return true;

  }

  disconnectGuild(guild:Guild){
    const guildId = guild.id;
    const i = this.connectedGuilds.findIndex(g => g == guildId);
    if(i>=0)this.connectedGuilds.splice(i,1);

  }

  pushGame = (game:Game) => this.games.push(game) 

  removeGame = (game:Game) => this.games = this.games.filter((g) => g.getId() != game.getId());

  getGames(){ return this.games }
  getConnectedGuilds(){ return this.connectedGuilds }
  
}
