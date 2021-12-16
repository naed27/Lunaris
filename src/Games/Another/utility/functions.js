const {containsKeyword,containsInitials} = require('../../Helpers/toolbox')
const {wrap,arrangeActions,concatNotifs,stringifyPlayerNames} = require('./utility')
const respond = require('../misc/responses');

class Functions{

  game;

  constructor(game){
    this.game = game;
  }


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
    let validTargets = []

    console.log('------- args --------');
    console.log(commandArguments);
    console.log('---------------------')
    console.log('scanning....')

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
        user.getPersonalChannel().alertChannel(respond.targetCantBeYourself(commandName));
        return {
          response:false,
          target:commandArguments
        }

      }

      if(foundPlayer.getStatus()=="Alive"){
        console.log('target cannot be targeted')
        //if target cannot be targeted
        user.getPersonalChannel().alertChannel(respond.targetIsNotAllowedToBeTargeted(foundPlayer));
        return {
          response:false,
          target:commandArguments
        }
        
      }

      if(foundPlayer.getStatus()=="Dead"){
        console.log('target is dead')
        //if target is dead
        user.getPersonalChannel().alertChannel(respond.targetIsDead(foundPlayer));
        return {
          response:false,
          target:commandArguments
        }

      }
             
    }else if(validTargets.length>1){
      console.log('keyword has multiple results')
      // if keyword has multiple results  
      user.getPersonalChannel().alertChannel(respond.keywordHasMultipleResults(commandArguments));
      return {
        response:false,
        target:commandArguments
      }

    }else{
      console.log('target not found')
      // if target was not found
      user.getPersonalChannel().alertChannel(respond.targetNotFound(commandArguments));
      return {
        response:false,
        target:commandArguments
      }
    }

  }

  findName(players,keyword){

    const idsFound = players.filter(player=>player.getListNumber()===keyword); 
    if(idsFound.length>0)return exactFound;

    const exactFound = players.filter((player)=>player.getUsername()===keyword);
    if(exactFound.length>0)return exactFound;

    const startWiths = players.filter(player=>player.getUsername().toLowerCase().startsWith(keyword.toLowerCase()));
    if(startWiths.length>0)return startWiths;

    const keysFound = players.filter(player=>containsKeyword(player.getUsername(),keyword));
    if(keysFound.length>0)return keysFound;

    const initialsFound = players.filter(player=>containsInitials(player.getUsername(),keyword));
    if(initialsFound.length>0)return initialsFound;


    return [];

  }

  messagePlayers(message){
    this.game.getPlayers().forEach(player => {
      player.getPersonalChannel().getDiscordConnection().send(message).catch();
    });
  }

  messageGhosts(message){
    this.game.getPlayers().forEach(player => {
      if(player.getStatus()=="Dead"){
        player.getPersonalChannel().getDiscordConnection().send(message).catch();
      }
    });
  }

  gameMessage(message){
    this.game.getPlayers().forEach(player => {
      player.getPersonalChannel().getDiscordConnection().send(wrap(message)).catch();
    });
  }

  stringifyWinners(){
    let string = "End Results:\n";
    this.game.getPlayers().forEach(p => {
      if(p.getWinStatus()){
        string+=`-----\n${p.getDiscord().user.username} (${p.getUsername()}) (Victorious)\nRole: ${p.getRole().getName()}\n`;
      }else{
        string+=`-----\n${p.getDiscord().user.username} (${p.getUsername()})\nRole: ${p.getRole().getName()}\n`;
      }
    });
    return string;
  }
  

  getVisitors(player){
    const visitors_actions = this.game.getActions().filter(a=>a.getFirstTarget().getId()==player.getId() && a.getCommand().VisitsTarget());
    const visitors=[];
    visitors_actions.forEach(va => {
      visitors.push(va.getPerformer());
    });
    return visitors;
  }

  whoArrivedAtTheSchoolSafely(){
    const alives = stringifyPlayerNames(this.game.getPlayers().filter((player)=>player.getStatus()==='Alive'));
    this.gameMessage(`${alives} arrived at the school safely.`);
  }

  async unlockStudentChannels(){
    await this.game.getPlayers().forEach(player => {
      player.getPersonalChannel().unlock();
    });
  }

  async lockStudentChannels(){
    await this.game.getPlayers().forEach(player => {
      player.getPersonalChannel().lock();
    });
  }

  async cleanChannel(channel){
    let fetched;
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
    const alivePlayers = this.game.getPlayers().filter(player=>player.getStatus()=='Alive');
    const students = alivePlayers.filter(player => player.getRole().Name==='Student');
    const ghosts = alivePlayers.filter(player => player.getRole().Name==='Ghost');

    if(students.length<1){
      ghosts.forEach((ghost)=>{
        ghost.setWinStatus(true);
      })
      this.game.getClock().setNextPhase('Game Over');
      this.game.getClock().skipPhase();
    }

    if(this.game.getDaysSinceGhostDied()===3){
      students.forEach(student => {
        student.setWinStatus(true);
      });
      this.game.getClock().skipPhase();
    }

    return
  }

  async gameCountDown(hourSand){
    await Promise.all(this.game.getPlayers().map(async (player) => {
      await player.getPersonalChannel().countDown({
        message:`The game will start in `,
        seconds:hourSand,
        cleanChannelFlag:true
      });
    }));
  }


  
  async deathListener(){
    const freshDeaths = this.game.getFreshDeaths();
    if(freshDeaths.length===0){
      return
    }


    this.game.clearPeaceCount();
    for (let i = 0; i < freshDeaths.length; i++) {
      await freshDeaths[i].playDeath();
    }
    return this.game.clearFreshDeaths();
  }

  processActions(){
    
    // process commands
    const actions = arrangeActions(this.game.getActions());
    actions.forEach(({performer,command,user,target}) => {
      command.Run({
        command:command,
        performer:performer,
        user:user,
        target:target
      })
    });
    this.game.clearActions();
      
    // process deaths
    this.game.getFreshDeaths().forEach(freshlyDeadPlayer => {
      freshlyDeadPlayer.pushNotif({player: `You have died.`})
    });

    // process notifs
    this.game.getPlayers().forEach(player => {
        const notifs = player.getNotifs();
        if(notifs.length===0)return
        const result = concatNotifs(notifs);
        player.getPersonalChannel().postMessage(result);
        player.clearNotifs();
    });
  }

  async gameOverMessage(message){
    this.game.getPlayers().forEach(async (player)=>{
      const gameOverAddress = await player.getPersonalChannel().getDiscordConnection().send(message);
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
          player.getDiscord().roles.remove(player.getClockChannelKey());
          player.getPersonalChannel().hideAndLock();
          
        }
        break;
        }
      });
    });
    
  }


}



module.exports = Functions;