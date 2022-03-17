import Game from '../game';
import Player from '../player'
import responses from '../archive/responses';
import ChannelManager from './channelManager';
import MessageManager from './messageManagers/messageManager';
import { GuildMember, Message, TextChannel, Interaction }  from 'discord.js';
import { createEmbed, createMenu, getStringSearchResults, parseCommand } from '../../../Helpers/toolbox';
import { 
  guide, 
  judge, 
  clock, 
  countDown,
  playerRole, 
  playerList, 
  phaseCommands, 
  availableCommands } from './messageManagers/generators';
import Action from '../action';
import Command from '../command';

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
  managePlayerList = () => this.playersListMessageManager;
  managePlayersRole = () => this.playersRoleMessageManager;
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

        // ---------------- If command call is successful

        const calledCommand = searchedCommands[0];
        const command = playerCommands.find(c => c.name === calledCommand);
        const { ARGS } = parseCommand( PREFIX, MESSAGE, command.getInputSeparator() );

        const menuParams = { ARGS, command, game: this.game, player: this.player }
        this.player.endAllActionInteractions();

        if(ARGS.length>0){
          if(command.targetCount===0) await noTargetUsingArgs(menuParams);

          if(command.targetCount===1) await findOneTargetUsingArgs(menuParams);
          
          if(command.targetCount===2) await findTwoTargetsUsingArgs(menuParams);
        }else{
          if(command.targetCount===0){
            await noTargetPopUp(menuParams)
          }else{
            if(command.hasMenu()){
              if(command.targetCount===1) 
                this.player.setInteractionCollectors([...await singleTargetMenu(menuParams)])
              if(command.targetCount===2) 
                this.player.setInteractionCollectors([...await doubleTargetMenu(menuParams)])
            }else{
              this.player.alert(responses.commandRequiresTarget(command))
            }
          }
        }
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
          
          if(this.player.isMafia()){
            const playerMessage = `**(${this.player.getRoleName()}) ${this.player.getUsername()}**: ${MESSAGE}`
            this.player.messageMafias(playerMessage);
            return
          }
          
          this.player.alert(responses.cantTalk);
          return
        }

        const playerMessage = `**${this.player.getUsername()}**: ${MESSAGE}`
        this.player.messagePlayers(playerMessage);
        return
        
      }
    })
  }
}

const processAction = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {

  const performer = command.performer({game: game, user: player});
  
  if(command.priority === 0){
    await command.run({
      args:ARGS,
      game:game,
      targetOne: player.getFirstActionTarget(),
      targetTwo: player.getSecondActionTarget(),
      command:command,
      user:player,
    })
    return
  }

  game.pushAction(new Action({
    user: player,
    args: ARGS,
    command: command,
    performer: performer,
    targets: player.getActionTargets()
  }))

  const response = await command.callResponse({
    args: ARGS,
    game: game,
    command: command,
    user: player,
    targetOne: player.getFirstActionTarget(),
    targetTwo: player.getSecondActionTarget(),
  })

  if(typeof response === 'string') 
    player.sendMarkDownToChannel(response)
}

const setDefaultTarget = async ({ command, game, player }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
  const defaultTarget = command.defaultTarget({game: game, user: player});
    if(defaultTarget!==null && defaultTarget !== undefined && defaultTarget.length>0){
      defaultTarget[0] && player.setFirstActionTarget(defaultTarget[0])
      defaultTarget[1] && player.setSecondActionTarget(defaultTarget[1])
    } 
}

const noTargetPopUp = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
    setDefaultTarget({command, game, player, ARGS});
    await processAction({ command, game, player, ARGS });
  }

const singleTargetMenu = async ({ command, game, player: user, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) =>{

  const targetables = command.targetables({game: game, user: user});

  const menu = createMenu({
    customId: `${user.getId()}_${command.name}_menu`,
    placeHolder: `Player Picker`,
    choices: targetables.map((player) => ({ label:player.getUsername(), value: player.getId() }))
  })
  const address = await user.sendEmbedWithMenu({
    description: `Choose who to ${command.name}.`,
    menu
  });

  if(!address) return

  const filter = (i:Interaction) => i.user.id === user.getId();
  const collector = address.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  
  collector.on('collect',async (i)=>{
    i.deferUpdate();
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]);
    if(!target) return
    user.setFirstActionTarget(target);
    processAction({ command, game, player: user, ARGS });
    return
  })

  collector.on('end',async (i)=>{
    address && address.delete();
    return
  })

  return [collector];
}

const doubleTargetMenu = async ({ command, game, player: user, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) =>{

  const targetables = command.targetables({game: game, user: user});

  const menu = createMenu({
    customId: `${user.getId()}_${command.name}_menu_one`,
    placeHolder: `Player Picker`,
    choices: targetables.map((player) => ({ label:player.getUsername(), value: player.getId() }))
  })

  const addressOne = await user.sendEmbedWithMenu({
    description: `Choose first target to ${command.name}.`,
    menu
  });

  const addressTwo = await user.sendEmbedWithMenu({
    description: `Choose second target to ${command.name}.`,
    menu
  });

  if(!addressOne || !addressTwo) return

  const filter = (i:Interaction) => i.user.id === user.getId();
  const collectorOne = addressOne.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  const collectorTwo = addressTwo.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  
  collectorOne.on('collect',async (i)=>{
    i.deferUpdate();
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]);
    if(!target) return
    user.setFirstActionTarget(target);
    preProcessAction();
    return
  })

  collectorOne.on('end',async (i)=>{
    addressOne.delete();
    return
  })

  collectorTwo.on('collect',async (i)=>{
    i.deferUpdate();
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]);
    if(!target) return
    user.setSecondActionTarget(target);
    preProcessAction();
    return
  })

  collectorTwo.on('end',async (i)=>{
    addressTwo.delete();
    return
  })

  function preProcessAction (){
    if(user.getActionTargets().length!==2) return;
    processAction({ command, game, player: user, ARGS });
  }

  return [collectorOne, collectorTwo];
}

const noTargetUsingArgs = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
  setDefaultTarget({command, game, player, ARGS});
  if(ARGS.length > 0 && !command.hasArguments())
    await player.alert(`(The '${command.getName()}' command does not need any targets.)`);
  processAction({ command, game, player, ARGS });
}

const findOneTargetUsingArgs = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {

  if(ARGS.length === 0 || (ARGS.length !== 1 && !command.hasArguments)) 
    return player.alert(responses.actionRequireOneTarget);

  const [targetKeyword, ...args ] = ARGS;
  const targetables = command.targetables({game: game, user: player});
  const searchResults = game.getFunctions().searchPlayerInChoices(targetables,targetKeyword)

  if(searchResults.length===0)
    return player.alert(responses.playerWithKeywordNotFound(targetKeyword));

  if(searchResults.length>1)
    return player.alert(responses.multiplePlayersFound({searchResults}));

  player.setFirstActionTarget(searchResults[0]);
  processAction({ command, game, player, ARGS: args });
}

const findTwoTargetsUsingArgs = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
  
  if(ARGS.length === 0 || (ARGS.length !== 2 && !command.hasArguments)) 
    return player.alert(responses.actionRequireTwoTargets);

  const [keywordOne, keywordTwo, ...args ] = ARGS;

  const targetables = command.targetables({game: game, user: player});
  const firstSearchResults = game.getFunctions().searchPlayerInChoices(targetables,keywordOne)
  const secondSearchResults = game.getFunctions().searchPlayerInChoices(targetables,keywordTwo)
  
  if(firstSearchResults.length === 0 || secondSearchResults.length === 0){
    if(firstSearchResults.length === 0)  player.alert(responses.playerWithKeywordNotFound(keywordOne));
    if(secondSearchResults.length === 0)  player.alert(responses.playerWithKeywordNotFound(keywordTwo));
    return
  }

  if(firstSearchResults.length > 1 || secondSearchResults.length > 1){
    if(firstSearchResults.length > 1)
      player.alert(responses.multiplePlayersFound({searchResults: firstSearchResults}));
    if(secondSearchResults.length > 1)
      player.alert(responses.multiplePlayersFound({searchResults: secondSearchResults}));
    return
  }
    
  player.setFirstActionTarget(firstSearchResults[0]);
  player.setSecondActionTarget(secondSearchResults[0]);
  processAction({ command, game, player, ARGS: args });
}