import Game from './game';
import Player from './player';
import { shuffleArray } from '../../Helpers/toolbox';
import { Guild, GuildMember, TextChannel } from 'discord.js';
import GameChannelManager from './gameChannelManager';

export default class Setup{

  game:Game;
  guild:Guild;
  gameChannel:TextChannel;

  constructor(game:Game){
    this.game = game;
    this.guild = game.getGuild();
  }

  async setupPlayers(){
    
    const joinedPlayers = this.game.getHost().getJoinedPlayers()
    const shuffledPlayers = shuffleArray([...joinedPlayers]);
  
    shuffledPlayers.map( async ( joinedPlayer:GuildMember )=> {
      const game = this.game;
      const profile = joinedPlayer;
      const channel = await this.createPrivateChannel();
      const player = new Player( game, profile, channel );
      this.game.connectPlayer( player );
    });
  }

  createPrivateChannel = async() => {
    const privateChannel = await this.guild.channels.create(`🌹﹕mobile`, {
      type: "GUILD_TEXT",
      permissionOverwrites: [
        {
          id: this.guild.roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ],
    })
    return privateChannel;
  }

  async createGameKey(){
    const key = await this.guild.roles.create({
      name: 'Clover Club',
      color: '#0f0f0f',
      permissions:[]
    });
    this.game.setGameKey(key); 
  }

  async setupStageChannel(){
    const game = this.game;
    const channel = await this.guild.channels.create(`🌹﹕stage`, {
      type: "GUILD_TEXT",
      permissionOverwrites: [
        {
          id: this.guild.roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ],
    })

    const stageChannelManager = new GameChannelManager({ channel,game })
    game.setStageChannel(channel);
    game.setStageChannelManager(stageChannelManager)
  }

  async distributeKeys(){
    const key = this.game.getGameKey();
    this.game.getPlayers().map(player => player.getDiscord().roles.add(key));
  }

  showPlayerChannels = async () => {
    this.game.getPlayers().map(async p => p.getChannelManager().show(p.getId()));
  }

  showStageChannel = async () => this.game.getStageChannelManager().show();

  setupPlayerListeners = async () =>  {
    this.game.getPlayers().map(async p => p.getChannelManager().listen());
  }

}
