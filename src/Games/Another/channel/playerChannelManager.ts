import { GuildMember, Message, TextChannel }  from 'discord.js';
import ChannelManager from './channelManager';
import Game from '../game';
import Player from '../player'
import MessageManager from './messageManagers/messageManager';
import { guide, playerRole, playerList, judge, clock, phaseCommands, availableCommands, countDown  } from './messageManagers/generators';
import { createEmbed, getStringSearchResults, parseCommand } from '../../../Helpers/toolbox';
// import responses from '../archive/responses';

interface ConstructorParams{
  game: Game
  channel: TextChannel,
  discord: GuildMember,
}

export default class PlayerChannelManager extends ChannelManager{

  readonly player: Player;
  readonly discord: GuildMember;

  readonly clockMessageManager = new MessageManager({ channel: this,  generator: clock });
  readonly guideMessageManager = new MessageManager({ channel: this,  generator: guide });
  readonly judgementMessageManager = new MessageManager({ channel: this,  generator: judge });
  readonly countDownMessageManager = new MessageManager({ channel: this,  generator: countDown });
  readonly playersRoleMessageManager = new MessageManager({ channel: this,  generator: playerRole });
  readonly playersListMessageManager = new MessageManager({ channel: this,  generator: playerList });
  readonly phaseCommandsMessageManager = new MessageManager({ channel: this,  generator: phaseCommands });
  readonly availableCommandsMessageManager = new MessageManager({ channel: this,  generator: availableCommands });

  constructor({ channel, discord: { id : defaultId } , game }: ConstructorParams){
    super({ game, channel, defaultId });
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
  
  // listen = () =>{
  //   const filter = (message:Message) => message.author.id === this.discord.id;
  //   const collector = this.channel.createMessageCollector({filter});

  //   collector.on('collect',async (m)=>{
  //     m.delete().catch();

  //     const MESSAGE = m.content;
  //     const PREFIX = this.game.getPrefix();
  //     const PHASE = this.game.getClock().getPhase().name;

  //     if(MESSAGE.startsWith(PREFIX)){

  //       const { COMMAND } = parseCommand( MESSAGE, PREFIX );
  //       const playerCommands = this.player.getCommands();
  //       const searchedCommands = getStringSearchResults(playerCommands.map(c => c.name),COMMAND);

  //       if(searchedCommands.length > 1) {
  //         const response = createEmbed({description: responses.multipleCommandsFound({searchResults:searchedCommands})})
  //         return
  //       };

  //       if(searchedCommands.length === 0) {
  //         const embed = createEmbed({description: responses.commandNeitherFoundNorAvailable})
  //         this.player.sendEmbedToChannel(embed)
  //         return
  //       }

  //       const calledCommand = searchedCommands[0];
  //       const command = playerCommands.find(c => c.name === calledCommand);
  //       console.log(command.getName());

  //     }else{
  //       if(this.player.isBlackmailed()) {
  //         this.player.getChannelManager().send(responses.blackmailed)
  //         return
  //       }

  //       const title = this.player.isJailed() ? `(Jailed) ` : ``;
  //       this.player.getChannelManager().send(MESSAGE);
  //       return
        
  //     }
  //   })
  // }
}