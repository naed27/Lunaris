import Game from '../game';
import Player from '../player'
import responses from '../archive/responses';
import ChannelManager from './channelManager';
import MessageManager from './messageManagers/messageManager';
import { GuildMember, Message, TextChannel }  from 'discord.js';
import { createEmbed, getStringSearchResults, parseCommand } from '../../../Helpers/toolbox';
import { 
  guide, 
  judge, 
  clock, 
  countDown,
  playerRole, 
  playerList, 
  phaseCommands, 
  availableCommands } from './messageManagers/generators';

interface ConstructorParams{
  game: Game, 
  player: Player,
  defaultId:string,
  channel:TextChannel, 
}

export default class PlayerChannelManager extends ChannelManager{

  readonly player: Player;
  readonly discord: GuildMember;

  readonly clockMessageManager: MessageManager;
  readonly guideMessageManager: MessageManager;
  readonly judgementMessageManager: MessageManager;
  readonly countDownMessageManager: MessageManager;
  readonly playersRoleMessageManager: MessageManager;
  readonly playersListMessageManager: MessageManager;
  readonly phaseCommandsMessageManager: MessageManager;
  readonly availableCommandsMessageManager: MessageManager;

  constructor({player, game, defaultId, channel}: ConstructorParams){
    super({ game, defaultId, channel });

    this.player = player;
    this.discord = player.getDiscord();

    this.clockMessageManager = new MessageManager({ channelManager: this,  generator: clock });
    this.guideMessageManager = new MessageManager({ channelManager: this,  generator: guide });
    this.judgementMessageManager = new MessageManager({ channelManager: this,  generator: judge });
    this.countDownMessageManager = new MessageManager({ channelManager: this,  generator: countDown });
    this.playersRoleMessageManager = new MessageManager({ channelManager: this,  generator: playerRole });
    this.playersListMessageManager = new MessageManager({ channelManager: this,  generator: playerList });
    this.phaseCommandsMessageManager = new MessageManager({ channelManager: this,  generator: phaseCommands });
    this.availableCommandsMessageManager = new MessageManager({ channelManager: this,  generator: availableCommands });

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
  
  listen = () =>{
    const filter = (message:Message) => message.author.id === this.discord.id;
    const collector = this.channel.createMessageCollector({filter});

    collector.on('collect',async (m)=>{
      m.delete().catch();

      const MESSAGE = m.content;
      const PREFIX = this.game.getPrefix();
      const PHASE = this.game.getClock().getPhase();

      if(MESSAGE.startsWith(PREFIX)){

        const { COMMAND } = parseCommand( PREFIX, MESSAGE );  

        const playerCommands = this.player.getCommands();
        const searchedCommands = getStringSearchResults(playerCommands.map(({name}) => name ), COMMAND);

        if(searchedCommands.length > 1) {
          this.player.alert(responses.multipleCommandsFound({searchResults:searchedCommands}));
          return
        };

        if(searchedCommands.length === 0) {
          this.player.alert(responses.commandNeitherFoundNorAvailable)
          return
        }

        const calledCommand = searchedCommands[0];
        const command = playerCommands.find(c => c.name === calledCommand);
        this.player.alert(`you called the ${command.getName()} command`);

      }else{


        if(this.player.isAlive() === false){
          const playerMessage = `**(Ghost) ${this.player.getUsername()}**: ${MESSAGE}`
          this.player.messageGhosts(playerMessage)
          return
        }

        if(PHASE.canTalk === false && PHASE.name !== 'Night'){
          this.player.alert(responses.cantTalk)
          return
        }

        if(this.player.isBlackmailed()) {
          this.player.alert(responses.blackmailed)
          return
        }

        if(PHASE.name === 'Night'){
          if(this.player.isMafia()){
            const playerMessage = `**(${this.player.getRoleName()}) ${this.player.getUsername()}**: ${MESSAGE}`
            this.player.messageMafias(playerMessage);
            return
          }

          if(this.player.isJailed()){
            const playerMessage = `**(Jailed) ${this.player.getUsername()}**: ${MESSAGE}`
            this.player.messageJailedPlayers(playerMessage);
            this.player.messageJailor(playerMessage);
            return
          }

          if(this.player.roleNameIs('Jailor')){
            const messageToJailed = `**Jailor**: ${MESSAGE}`
            const messageToSelf = `**Jailor (You)**: ${MESSAGE}`
            this.player.messageJailedPlayers(messageToJailed);
            this.player.messageJailor(messageToSelf);
            return
          }
        }

        const playerMessage = `**${this.player.getUsername()}**: ${MESSAGE}`
        this.player.messageAlivePlayers(playerMessage);
        return
        
      }
    })
  }
}