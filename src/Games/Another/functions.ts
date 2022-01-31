import Game from "./game";

import { stringContainsKeyword, stringContainsInitials, jsonWrap, stringifyArrayOfNames } from '../../Helpers/toolbox';
import Player from "./player";
import Action from "./action";
import { Collection, Message, TextChannel } from "discord.js";
import Notif from "./notif";
import responses from "./archive/responses";

export default class Functions{

  game: Game;

  constructor(game: Game){ this.game = game }

  parseArguments(command,commandArguments,user){
    
    // this function returns an element

    // first, find the possible valid targets
    const targetables = command.Targetables({
      user:user,
      game:this.game
    });

    // separate the target and the argument
    let targetQuery = '';
    let sliceIndex = 0;
    let validTargets = [];

    console.log('------- args --------');
    console.log(commandArguments);
    console.log('---------------------');
    console.log('scanning....');

    // scan the args to find the whole 'name' of the target
    for (let i = 1; i <= commandArguments.length; i++) {
      console.log('--------------')
      targetQuery = commandArguments.slice(0,i).join();
      console.log(`targetQuery: ${targetQuery}`)
      const results = this.findName(targetables,targetQuery)
      console.log('results:');
      console.log(results);
      if(results.length===0){
        sliceIndex=i-1;
        break;
      }
      validTargets=[...results];
      console.log('validTargets:')
      console.log(validTargets);
    }

    // separate the target with the arguments by slicing
    const args = commandArguments.slice(sliceIndex,commandArguments.length).join(' ');
    console.log('args:')
    console.log(args);
    const commandName = command.Name;

    // if target is valid
    if(validTargets.length==1){
      console.log('target is valid');
      return {
        response:true,
        target:validTargets[0],
        args:args
      }
    }
    console.log('target is not valid')
    

    // if not valid, do another search to determine why its not  
    const foundPlayers = this.findName(this.game.getPlayers(),targetQuery);

    if(foundPlayers.length==1){
      const foundPlayer = foundPlayers[0];
      if(foundPlayer.getId()==user.getId()){
        console.log('you cannot target yourself');
        //if target is yourself
        user.getPersonalChannel().alertChannel(responses.youCantTargetYourself);
        return {
          response:false,
          target:commandArguments
        }

      }

      if(foundPlayer.getStatus()=="Alive"){
        console.log('target cannot be targeted')
        //if target cannot be targeted
        user.getPersonalChannel().alertChannel(responses.playerCannotBeTargeted);
        return {
          response:false,
          target:commandArguments
        }
        
      }

      if(foundPlayer.getStatus()=="Dead"){
        console.log('target is dead')
        //if target is dead
        user.getPersonalChannel().alertChannel(responses.playerIsDead);
        return {
          response:false,
          target:commandArguments
        }

      }
             
    }else if(validTargets.length>1){
      console.log('keyword has multiple results')
      // if keyword has multiple results  
      user.getPersonalChannel().alertChannel(responses.multiplePlayersFound({players:validTargets}));
      return {
        response:false,
        target:commandArguments
      }

    }else{
      console.log('target not found')
      // if target was not found
      user.getPersonalChannel().alertChannel(responses.playerNeitherFoundNorAvailable);
      return {
        response:false,
        target:commandArguments
      }
    }

  }

  findName(players: Player[], keyword: string){

    const listnumberResults: Player[] = [];
    const exactResults: Player[] = [];
    const startWithsResult: Player[] = [];
    const keywordResults: Player[] = [];
    const initialsResults: Player[] = [];

    players.map((player) => {
      player.getListNumber() === keyword && listnumberResults.push(player);
      player.getUsername() === keyword && exactResults.push(player);
      player.getUsername().toLowerCase().startsWith(keyword.toLowerCase()) && startWithsResult.push(player);
      stringContainsKeyword(player.getUsername(), keyword) && keywordResults.push(player);
      stringContainsInitials(player.getUsername(), keyword) && initialsResults.push(player);
    })
 
    if(listnumberResults.length>0)return listnumberResults;
    if(exactResults.length>0)return exactResults;
    if(startWithsResult.length>0)return startWithsResult;
    if(keywordResults.length>0)return keywordResults;
    if(initialsResults.length>0)return initialsResults;
    return [];
  }

  messagePlayers = async (a:string) => this.game.getPlayers().map((p)=>p.getChannelManager().send(a))

  messageGhosts = async (message: string) => {
    this.game.getPlayers().map((p)=>p.getStatus()=='Dead' && p.getChannelManager().send(message))
  }

  messagePlayersWrapped = async (message: string) => {
    const content = jsonWrap(message);
    this.game.getPlayers().map((p)=>p.getChannelManager().send(content));
  }

  stringifyWinners(){
    const title = 'End Results:\n';
    const body = this.game.getPlayers().map((player)=>{
      const separator = `-----`;
      const playerUsername = player.getUsername()
      const playerRole = player.getRole().getName();
      const playerDiscord = player.getDiscord().user.username;
      const playerStatus = player.isWinner() ? '(Won)' : '(Lost)';

      return separator + '\n' + playerDiscord + ' \ ' + playerUsername + '\n' + `(${playerStatus})` + 'Role:' + playerRole
    }).join('\n');

    return title + body;
  }
  

  getVisitors = (player: Player) => {
    const visitors_actions = this.game.getActions().filter(a=>a.getFirstTarget().getId()==player.getId() && a.getCommand().VisitsTarget());
    const visitors=[];
    visitors_actions.forEach(va => visitors.push(va.getPerformer()));
    return visitors;
  }

  whoArrivedAtTheSchoolSafely(){
    const alives = stringifyArrayOfNames(
      this.game.getPlayers().
      filter((player) => player.isAlive())
      .map((player) => player.getUsername())
    );
    this.messagePlayersWrapped(`${alives} arrived at the school safely.`);
  }

  lockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().lock());
  unlockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().unlock());

  cleanChannel = async (channel: TextChannel) => {
    let fetched: Collection<string, Message<boolean>>;
    do {
      fetched = await channel.messages.fetch({limit: 100});
      await channel.bulkDelete(fetched);
    }
    while(fetched.size >= 2);
  }

  async resetDay(){
    this.game.getPlayers().forEach(player => {
      player.clearVisitors();
      player.clearNotifs();
    });
  }

  async listenForWinners(){
    const ghosts = this.game.getAlivePlayers().filter(player => player.roleNameIs('Ghost'));
    const students = this.game.getAlivePlayers().filter(player => player.roleNameIs('Student'));

    if(students.length<1){
      ghosts.forEach((ghost) => ghost.setWinStatus(true))
      this.game.getClock().setNextPhase('Game Over');
      this.game.getClock().skipPhase();
    }

    if(this.game.getDaysSinceGhostDied()===3){
      students.forEach(student => student.setWinStatus(true));
      this.game.getClock().skipPhase();
    }
  }
  
  async deathListener(){
    const freshDeaths = this.game.getFreshDeaths();
    if(freshDeaths.length===0) return

    this.game.resetPeaceCount();
    for (let i = 0; i < freshDeaths.length; i++) {
      await freshDeaths[i].playDeath();
    }
    return this.game.clearFreshDeaths();
  }

  arrangeActions = (actions: Action []) =>{
    return actions.sort((a,b)=>{
        const aPriority = a.getCommand().getPriority();
        const bPriority = b.getCommand().getPriority();
        if(aPriority<bPriority)return -1;
        if(aPriority>bPriority)return 1;
        return 0;
    });
}

  processActions = () => {
    
    // process commands
    const actions = this.arrangeActions(this.game.getActions());
    actions.forEach((a) => {
      a.getCommand().run({
        game: this.game,
        user: a.getUser(),
        args: a.getArgs(),
        command: a.getCommand(),
        performer: a.getPerformer(),
        targetOne: a.getFirstTarget(),
        targetTwo: a.getSecondTarget(),
      })
    });

    this.game.clearActions();
      
    // process deaths
    this.game.getFreshDeaths().forEach(e => e.pushNotif(new Notif({ inbox: `You have died.` })));

    // send notifs
    this.game.getPlayers().forEach(player => {
        const notifs = player.getNotifs();
        if(notifs.length === 0)return
        const result = jsonWrap(notifs.join('\n'));
        player.getChannelManager().send(result);
        player.clearNotifs();
    });
  }

  gameOverMessage = async (message) => {
    this.game.getPlayers().forEach(async (player)=>{
      const gameOverAddress = await player.getChannelManager().send(message);
      gameOverAddress.react('🚪');
      const filter = (user) => !user.bot;
      const collector = gameOverAddress.createReactionCollector({filter});
      collector.on('collect', async (reaction, user) => {
        if(user.bot)return
        switch(reaction.emoji.name){
        case "🚪": {
          player.getConfiscatedValuables().forEach(async valuable => {
            player.getDiscord().roles.add(valuable);
          });
          player.getDiscord().roles.remove(this.game.getGameKey());
          player.getChannelManager().hideAndLock();
        }
        break;
        }
      });
    });
    
  }
}
