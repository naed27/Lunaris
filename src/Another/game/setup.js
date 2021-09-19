const {rolesList} = require("../misc/roles");
const Player = require("./components/player");
const Channel = require('./components/channel');
const {shuffleArray} = require('../../Helpers/toolbox');
const {cloneDeep} = require('lodash');
const {wrap} = require('../utility/utility');
// const { Permissions } = require('discord.js');


class Setup{

  game;
  gameChannel;

  constructor(game){
    this.game = game;
  }



  async setupPlayers(){
    
    const players = shuffleArray([...this.game.getHost().getPlayers()]);
    
    const ghostCount = this.game.getNumberOfGhosts();
    const studentCount = players.length-ghostCount;

    const gameRoles = shuffleArray([
      ...this.getCopyOfRole('Ghost',ghostCount),
      ...this.getCopyOfRole('Student',studentCount)
    ]);
    
    for (let i = 0; i < gameRoles.length; i++) {
      const player = new Player(this.game,i+1,players[i],cloneDeep(gameRoles[i]));
      this.game.connectPlayer(player);
      this.game.connectGuild(player.getGuild());
      await this.setupPersonalChannels(player);
    }
  }

  async setupPersonalChannels(player){

    const houseChannel = await player.getGuild().channels.create(`🌹﹕main`, {
      type: "text",
      permissionOverwrites: [
        {
          id: player.getGuild().roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        },
        {
          id: player.getId(), 
          allow: ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          deny: []
        },
      ],
    })
    player.pushChannel(new Channel("personal channel",houseChannel,this.game,player));
    
  }


  async setupGuides(){

    let content;

    await this.game.getPlayers().forEach(async player => {
      content = `This is your Notepad Channel\n\n- Use this channel to write any important details in the game.\n- You can only send 1 message so just edit it when you have to.`;

      player.getNotepad().getChannel().send(wrap(content)).catch();
      await player.getPersonalChannel().updateShortGuide();
      await player.getPersonalChannel().updateCommandList();
      player.getPersonalChannel().updatePlayerCard();
    });
  } 

  async createClockChannel(){

    for await (const guild of this.game.getConnectedGuilds()) {
      
      const temp = await guild.channels.create(`⏳﹕clock`, {
        type: "text",
        permissionOverwrites: [
          {
            id: guild.roles.everyone, 
            allow: [],
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
          },
        ],
      });
      this.game.pushClockChannel(new Channel("clock",temp));
      
    }

  }

  
  async createClockChannelKeys(){

    for await (const guild of this.game.getConnectedGuilds()) {
      
      const channelKey = await guild.roles.create({
        name: 'Another',
        color: '#0f0f0f',
        permissions:[]
      });
      this.game.pushClockChannelKey(channelKey); 
      
    }
  }

  async distributeClockChannelKeys(){
    
    this.game.getPlayers().forEach(player => {
      const user = player.getDiscord();
      const keys = this.game.getClockChannelKeys().filter(key=>key.guild.id==player.getGuild().id);
      keys.forEach(key => {
          user.roles.add(key);
          player.setClockChannelKey(key);
      });
    });
  }


  async showStartingChannels(){

    // show player channels
    this.game.getPlayers().forEach(player => {
      player.getConfiscatedValuables().forEach(valuable => {
        player.getDiscord().roles.remove(valuable);
      });
      player.getChannels().forEach(channel => {
        channel.show(player.getId());
      });
    });

    // show clock channels
    this.game.getClockChannels().forEach(clockChannel => {
      this.game.getClockChannelKeys().filter(key=>key.guild.id==clockChannel.getDiscordConnection().guild.id)
      .forEach(clockChannelKey => {
        clockChannel.show(clockChannelKey.id);
      });
    });
  }

  
  async setupPlayerListeners(){
    this.game.getPlayers().forEach(player => {
      player.getPersonalChannel().setupListener();
    });
  }

  getCopyOfRole(roleName,quantity){
    let gameRoles=[];
    for (let i = 0; i < quantity; i++) {
      gameRoles = [...gameRoles,...rolesList.filter((role)=>role.Name===roleName)];
    }
    return gameRoles
  }

}

module.exports = Setup;