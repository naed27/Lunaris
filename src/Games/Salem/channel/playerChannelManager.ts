import { GuildMember, Message, TextChannel }  from 'discord.js';
import ChannelManager from './channelManager';
import Game from '../game';
import Player from '../player'
import MessageManager from './messageManagers/messageManager';

interface ConstructorParams{
  channel:TextChannel,
  discord:GuildMember,
  game:Game
}

export default class PlayerChannelManager extends ChannelManager{

  readonly player: Player;
  readonly discord: GuildMember;

  readonly guideMessageManager = new MessageManager(this);
  readonly phaseMessageManager = new MessageManager(this);
  readonly timerMessageManager = new MessageManager(this);
  readonly profileMessageManager = new MessageManager(this);
  readonly judgementMessageManager = new MessageManager(this);
  readonly countDownMessageManager = new MessageManager(this);
  readonly playersListMessageManager = new MessageManager(this);

  constructor({ channel, discord: {id:defaultId} , game }: ConstructorParams){
    super({ game, channel, defaultId });
  }
  
  
  listen = () =>{
    const filter = (message:Message) => message.author.id === this.discord.id;
    const collector = this.channel.createMessageCollector({filter});

    collector.on('collect',async (m)=>{
        if(this.game.getClock().getPhase().name === 'Discussion')return
        const message = m.content;
    })
  }

  getPlayer = () => this.player;
  getDiscord = () => this.discord;

  manageGuide = () => this.guideMessageManager;
  managePhase = () => this.phaseMessageManager;
  manageTimer = () => this.timerMessageManager;
  manageProfile = () => this.profileMessageManager;
  manageCountDown = () => this.countDownMessageManager;
  manageJudgement = () => this.judgementMessageManager
  managePlayersList = () => this.playersListMessageManager;
}