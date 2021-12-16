import { GuildMember, Message, TextChannel }  from 'discord.js';
import ChannelManager from './channelManager';
import Game from '../game';
import Player from '../player'
import MessageManager from './messageManagers/messageManager';
import { guide, playerRole, playerList, judge, clock, phaseCommands, availableCommands, countDown  } from './messageManagers/generators';

interface ConstructorParams{
  channel:TextChannel,
  discord:GuildMember,
  game:Game
}

export default class PlayerChannelManager extends ChannelManager{

  readonly player: Player;
  readonly discord: GuildMember;

  readonly clockMessageManager = new MessageManager({channel:this, generator:clock});
  readonly guideMessageManager = new MessageManager({channel:this, generator:guide});
  readonly judgementMessageManager = new MessageManager({channel:this, generator:judge});
  readonly countDownMessageManager = new MessageManager({channel:this, generator:countDown});
  readonly playersRoleMessageManager = new MessageManager({channel:this, generator:playerRole});
  readonly playersListMessageManager = new MessageManager({channel:this, generator:playerList});
  readonly phaseCommandsMessageManager = new MessageManager({channel:this, generator:phaseCommands});
  readonly availableCommandsMessageManager = new MessageManager({channel:this, generator:availableCommands});

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

  manageClock = () => this.clockMessageManager;
  manageGuide = () => this.guideMessageManager;
  manageJudgement = () => this.judgementMessageManager;
  manageCountDown = () => this.countDownMessageManager;
  managePlayersRole = () => this.playersRoleMessageManager;
  managerPlayerList = () => this.playersListMessageManager;
  managePhaseCommands = () => this.phaseCommandsMessageManager;
  manageAvailableCommands = () => this.availableCommandsMessageManager;
}