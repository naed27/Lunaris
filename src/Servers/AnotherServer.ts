const {containsElement} = require('../Helpers/toolbox');

export default class Server{

  games=[];
  connectedGuilds = [];

  //--------------------- Server Functions ----------------------

  connectGuild(guild_id){

    // check if the guild is already playing
    if(containsElement(this.connectedGuilds,guild_id))
      return false;

    // if not, let the guild connect
    this.connectedGuilds.push(guild_id);
    return true;

  }

  disconnectGuild(guild_id){

    const i = this.connectedGuilds.findIndex(g => g == guild_id);
    if(i>=0)this.connectedGuilds.splice(i,1);

  }

  pushGame(game){ this.games.push(game) }

  removeGame(game_id){
    
    const connectedGuilds = this.games[0].getConnectedGuilds();
    
    connectedGuilds.forEach(guild => {
        this.disconnectGuild(guild.id);
    });

    const i = this.games.findIndex(game => game.getId() == game_id);
    if(i>=0){this.games.splice(i,1);}
  }

  getGames(){ return this.games }
  getConnectedGuilds(){ return this.connectedGuilds }
  
}
