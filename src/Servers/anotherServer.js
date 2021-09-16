const {containsElement} = require('../Helpers/toolbox');

module.exports = class Server{

  games=[];
  connectedGuilds = [];

  //--------------------- server functions ----------------------

  connectGuild(guild_id){

    // check if the guild is already playing
    if(containsElement(this.connectedGuilds,guild_id))
      return false;

    // if not, let the guild connect
    this.connectedGuilds.push(guild_id);
    return true;

  }

  disconnectGuild(guild_id){

    // disconnects a guild from the server
    let i = this.connectedGuilds.findIndex(g => g == guild_id);
    if(i>=0)this.connectedGuilds.splice(i,1);

  }

  pushGame(game){

    // pushes a new game into the game list
    this.games.push(game);

  }

  removeGame(game_id){
    
    // get the connected guilds in the game
    let connectedGuilds = this.games[0].getConnectedGuilds();
    
    // disconnects all those guilds from the server
    connectedGuilds.forEach(guild => {
        this.disconnectGuild(guild.id);
    });

    // finally, remove the game
    let i = this.games.findIndex(game => game.getId() == game_id);
    if(i>=0){this.games.splice(i,1);}
  }

  // getters
  getGames(){return this.games;}
  getConnectedGuilds(){return this.portals;}
  
}
