import Game from './game';
import Player from './player';
import { shuffleArray } from '../../Helpers/toolbox';
import { Guild, GuildMember, TextChannel } from 'discord.js';

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

  async distributeClockChannelKeys(){
    const key = this.game.getGameKey();
    this.game.getPlayers().map(player => player.getDiscord().roles.add(key));
  }

  showStartingChannels = () => {
    this.game.getPlayers().map(p => p.getChannelManager().show(p.getId()));
  }

  async setupPlayerListeners(){
    this.game.getPlayers().map(p => p.getChannelManager().listen());
  }

}
