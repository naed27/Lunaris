const {createEmbed} = require('../utility/utility');

class Host{

    game;
    gameHost;
    players = [];
    goFlag=false;
    hostEmbed;
    embedColor = "#000000";
    requireMinimumPlayers = 2;
    maximumNumberOfPlayers = 5;

    constructor(message, game){
      this.game = game;
      this.gameHost = message.author;
      this.channel = message.channel;
      this.guild = message.channel.guild;
    }

    // getters
    getPlayers(){return this.players;}
    getGameHost(){return this.gameHost;}
    getGameHostId(){return this.gameHost.id}
    getTown(){return this.game;}

    async listenForPlayers(){

      // ready the discord embed
      const embed = createEmbed({
        author:'Another',
        body:`Players:\n\n\nReact with 🚪 to join.`,
        footer:`Hosted by: ${this.gameHost.username}`
      });

  
      // send the embed to discord
      this.hostEmbed = await this.channel.send({embeds:[embed]});

      // ready the reaction listener
      const reactionFilter = () => {return true};
      let reactCollector = this.hostEmbed.createReactionCollector({reactionFilter, time: 180000, dispose:true});
      
      reactCollector.on('remove', async(reaction,user) => {
        if(user.bot)return 

        switch(reaction.emoji.name){
          //if user removed his door react, let him leave the lobby
          case "🚪": 
            this.removePlayer(user);
            this.updatePlayerList();
          break;
        }
      })

      // listen for reaction (on click of reaction)
      reactCollector.on('collect', async (reaction, user) => {

        // if the reactor is a bot, exit out
        if(user.bot)return 

        // if the reactor is human
        switch(reaction.emoji.name){
          case "🚪": 
            // let the player join
            this.addPlayer(user);
            break;

          case "▶️":

            // if the players aren't enough or the clicker isnt the host, don't start
            if(user.id!==this.gameHost.id || this.players.length<this.requireMinimumPlayers)
            return this.hostEmbed.reactions.resolve(reaction.emoji.name).users.remove(user.id);

            // if the players are enough, go start
            this.goFlag=true;
            reactCollector.stop();
            break;
          
          case "❌": 

            // if the clicker is the host, cancel the game
            if(user.id==this.gameHost.id)
              reactCollector.stop();
            break;

          default:break;
        }
      });

      reactCollector.on('dispose', async () => {
        console.log('disposed');
        reactCollector.stop();
      });

      reactCollector.on('end', async () => {

        // if the host cancelled the game
        if(this.goFlag==false){
          this.hostEmbed.reactions.removeAll();
          this.updatePlayerList();

          const embed = createEmbed({
            author:'Another',
            body:`Cancelled.`,
            footer:``
          });
          

          this.editHostCard(embed);
          this.game.getServer().disconnectGuild(this.guild);
          this.game.getServer().removeGame(this.game.id);

        // if the host pressed start
        }else if(this.goFlag==true){
          this.goFlag="yeet";

          const embed = createEmbed({
            author:'Another',
            body:`Players:\n${this.getJoinedPlayers()}`,
            footer:`Loading up the game. Please wait...`
          });
          
          this.hostEmbed.edit(embed)

          this.hostEmbed.reactions.removeAll();

          // GAME STARTO!!
          this.game.setupGame(this.players);
        }
      });

      await this.hostEmbed.react('🚪').catch();
      await this.hostEmbed.react('▶️').catch();
      await this.hostEmbed.react('❌').catch();

    }

    addPlayer(user){

      // if game is full, return
      if(this.players.length===this.maximumNumberOfPlayers)return;

      // if player is not new, return
      if(!this.isNewPlayer(user))return;

      const discord = this.guild.members.cache.get(user.id);
      // if player is good, push
      this.players.push(discord);

      // update player list
      this.updatePlayerList();

    }

    removePlayer(user){
      let index = this.players.findIndex(player => player.user.id == user.id);
      if (index > -1) {
        this.players.splice(index, 1);
      }
      this.updatePlayerList();
    }

    isNewPlayer(user){
      let result = this.players.filter(player => player.id == user.id);
      if(result.length==0){
        return true;
      }else{
        return false;
      }
    }

    getJoinedPlayers(){
      let player_list="";
      let i=1;
      this.players.forEach(player => {
        player_list+=`- ${player.user.username}`;
        if(i!=this.players.length){
          player_list+=`\n`;
        } i++;
      });
      return player_list;
    }

    updatePlayerList(){
      let player_list = this.getJoinedPlayers();

      const embed = createEmbed({
        author:'Another',
        body:`Players:\n${player_list}\n\nReact with 🚪 to join.`,
        footer:`Hosted by: ${this.gameHost.username}`
      });

      this.editHostCard(embed);
    }

    async notifyGameStart(players){
      let resultString = "**Players:**";
      players.forEach(p => {
          resultString+=`\n- ${p.getUsername()}`;
      });

      const embed = createEmbed({
        author:'Another',
        body:`${resultString}\n`,
        footer:`Game is currently ongoing.`
      });

      this.editHostCard(embed);
    }

    async notifyGameEnd(players){
      let resultString = "End Results:\n";
      players.forEach(p => {
        let discord = p.getGuild().members.cache.get(p.getId());
        let real_name = discord.user.username;
        if(p.getWinStatus()){
          resultString+=`-----\nUsername: ${p.getUsername()}\nDiscord Name: ${real_name}\nRole: ${p.getRole().getName()} (Victorious)\n`;
        }else{
          resultString+=`-----\nUsername: ${p.getUsername()}\nDiscord Name: ${real_name}\nRole: ${p.getRole().getName()} (Defeated)\n`;
        }
      });

      const embed = createEmbed({
        author:'Another',
        body:`${resultString}\n`,
        footer:`Game has ended.`
      });
      
      this.editHostCard(embed);
    }

    editHostCard(embed){
      this.hostEmbed.edit({embeds:[embed]});
    }
    
}

module.exports = Host;