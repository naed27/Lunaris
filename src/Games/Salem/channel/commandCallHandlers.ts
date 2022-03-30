import Command from "../command";
import Game from "../game";
import Player from "../player";
import responses from '../archive/responses';
import Action from "../action";
import { createMenu } from "../../../Helpers/toolbox";
import { Interaction } from "discord.js";

export interface CommandParams {
  game: Game;
  args: string[];
  user: Player;
  command: Command;
  performer: Player;
  firstTarget: Player | "None";
  secondTarget: Player | "None";
}

export const processAction = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {

  const performer = command.performer({game: game, user: player});

  const commandParams: CommandParams = {
    game: game,
    args: ARGS,
    user: player,
    command: command,
    performer: performer,
    firstTarget: player.getFirstActionTarget(),
    secondTarget: player.getSecondActionTarget(),
  }
  
  if(command.priority === 0)
    return await command.run(commandParams)
    
  game.pushAction(new Action(commandParams))

  player.sendCallResponse({command, commandParams})
}

export const setDefaultTarget = async ({ command, game, player }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
  const defaultTarget = command.defaultTarget({game: game, user: player});
  if(defaultTarget!==null && defaultTarget !== undefined && defaultTarget.length>0){
    defaultTarget[0] && player.setFirstActionTarget(defaultTarget[0])
    defaultTarget[1] && player.setSecondActionTarget(defaultTarget[1])
  } 
}

export const noTargetPopUp = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
    setDefaultTarget({command, game, player, ARGS});
    await processAction({ command, game, player, ARGS });
}

export const singleTargetMenu = async ({ command, game, player: user, ARGS }:{
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

  if(!address) return []

  const filter = (i:Interaction) => i.user.id === user.getId();
  const collector = address.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  
  collector.on('collect',async (i)=>{
    i.deferUpdate();
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]) || undefined;
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

export const doubleTargetMenu = async ({ command, game, player: user, ARGS }:{
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

  if(!addressOne || !addressTwo) return []

  const filter = (i:Interaction) => i.user.id === user.getId();
  const collectorOne = addressOne.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  const collectorTwo = addressTwo.createMessageComponentCollector({ filter,componentType:'SELECT_MENU' });
  
  collectorOne.on('collect',async (i)=>{
    i.deferUpdate();
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]) || undefined;
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
    const target = game.getPlayers().find((p) =>p. getId() === i.values[0]) || undefined;
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

export const noTargetUsingArgs = async ({ command, game, player, ARGS }:{
  command: Command, game: Game, player: Player, ARGS: string[] }) => {
  setDefaultTarget({command, game, player, ARGS});
  if(ARGS.length > 0 && !command.hasArguments())
    await player.alert(`(The '${command.getName()}' command does not need any targets.)`);
  processAction({ command, game, player, ARGS });
}

export const findOneTargetUsingArgs = async ({ command, game, player, ARGS }:{
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

export const findTwoTargetsUsingArgs = async ({ command, game, player, ARGS }:{
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