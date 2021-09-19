const valuables = require('../../misc/valuables');
const {
  containsElement,
  containsKeyword,
  containsInitials,
  delay} = require('../../../Helpers/toolbox');
const {wrap,parseDiary} = require('../../utility/utility');
  
const Role = require('./role')

class Player{

  id;
  discord;
  inGameName;
  listNumber;

  game;
  guild;
  role;

  status = "Alive";
  channels=[];
  isJailed=false;
 
  visitors = [];
  judgement = [];
  causeOfDeath=[];
  confiscatedValuables = [];
  notifications = [];
  diaryLogs = [];

 

  target;

  winStatus = false;


  constructor(game,listNumber,player,role){

    this.listNumber = listNumber;
    this.id = player.user.id;
    this.discord = player;
    this.inGameName = player.user.username;

    this.game=game;
    this.guild = player.guild;
    this.role = new Role(role);

    valuables.filter(valuable=>valuable.Guild.id==this.guild.id)
    .forEach(valuable => {
      valuable.Roles.forEach(async valuableRole => {
        if (this.discord.roles.cache.some(role => role.id === valuableRole)) {
          const roleHolder = await this.discord.roles.cache.get(valuableRole);
          this.confiscatedValuables.push(roleHolder);
        }
      });
    });

  }

  // ------------------------------------- FUNCTION DUMP

  async playDeath(){
    let message;
    
    await delay(2000);
    if(this.causeOfDeath.length>0){
      if(this.causeOfDeath[0]=="committed suicide"){
        return
      }else{
        if(this.causeOfDeath.length>1){
          message = `${this.getUsername()} was brutally murdered last night.`;
        }else{
          message = `${this.getUsername()} died last night.`;
        }
        await this.game.getFunctions().gameMessage(message);
        await delay(3000);

        for (let i = 0; i < this.causeOfDeath.length; i++) {
          message = `${this.causeOfDeath[i]}`;
          await this.game.getFunctions().gameMessage(message);
          await delay(2000);
        }
      }
    }

    if(this.diaryLogs.length>0){
      
      const diaryNotice = `We found a diary beside ${this.getUsername()}'s body.`;
      this.game.getFunctions().gameMessage(diaryNotice);

      await Promise.all(this.game.getPlayers().map(async (player) => {
        await this.showDiary(player);
      }));

      await delay(3000);
    }
  }


  getAvailableCommands(){
    const phase = this.game.getClock().getPhase();
    const allCommands = this.getRole().getCommands();
    const roleCommands = allCommands.filter(command=>command.Authorization=="Role Holder" && command.Stocks>0 && containsElement(command.RequiredStatus,this.getStatus()) && containsElement(command.Phase,phase))
    const playerCommands = allCommands.filter(command=>command.Authorization=='Player' && containsElement(command.RequiredStatus,this.getStatus()) && containsElement(command.Phase,phase));
    const hostCommands = allCommands.filter(command=>command.Authorization=='Host' && containsElement(command.RequiredStatus,this.getStatus())&& containsElement(command.Phase,phase));
    const adminCommands = allCommands.filter(command=>command.Authorization=='Admin' && containsElement(command.RequiredStatus,this.getStatus())&& containsElement(command.Phase,phase));
    
    const availableCommands = [
      ...roleCommands,
      ...playerCommands
    ];
    
    if(this.game.isHost(this.getId()))
      availableCommands.push(...hostCommands);
    
    if(this.getId()=="481672943659909120")
      availableCommands.push(...adminCommands);
    
    return availableCommands;
  }

  findCommand(keyword){

    const commands = this.getAvailableCommands();

    const exactFound = commands.filter((command)=>command.Name===keyword);
    if(exactFound.length>0)return exactFound;

    const startWiths = commands.filter(command=>command.Name.toLowerCase().startsWith(keyword.toLowerCase()));
    if(startWiths.length>0)return startWiths;

    const keysFound = commands.filter(command=>containsKeyword(command.Name,keyword));
    if(keysFound.length>0)return keysFound;

    const initialsFound = commands.filter(command=>containsInitials(command.Name,keyword));
    if(initialsFound.length>0)return initialsFound;

    return [];

  }

  async showDiary(player){
    const diaryPages = parseDiary({diaryOwner:this,diaryReader:player});
    let page = 0;
    const diaryMessage = await player.getPersonalChannel().getDiscordConnection().send({content:wrap(diaryPages[page])});
    await diaryMessage.react('📔');
    const filter = user => !user.bot;
    const collector = diaryMessage.createReactionCollector({filter});
    collector.on('collect', async (reaction,user) => {
      if(user.bot)return
      switch(reaction.emoji.name){
        case "📔": {
          page = 1;
          await diaryMessage.reactions.removeAll();
          await diaryMessage.react('⏪');
          await diaryMessage.react('◀️');
          await diaryMessage.react('▶️');
          await diaryMessage.react('⏩');
          await diaryMessage.react('❌');
          }
        break;
        case "❌": 
          page=0;
          await diaryMessage.reactions.removeAll();
          diaryMessage.react('📔');
        break;
        case "⏪": 
          page=1;
        break;
        case "◀️":
          if(page === 0)return 
          page--;
        break;
        case "▶️": 
          if(page === diaryPages.length-1)return 
          page++;
        break;
        case "⏩": 
          page=diaryPages.length-1;
        break;
      }
      diaryMessage.edit(diaryPages[page]);
    });

  }

  
  


  // ------------------------------------- SETTERS / GETTERS




  getVisitors(){return this.visitors;}

  pushVisitor(newVisitor){
    const index = this.visitors.findIndex(oldVisitor => oldVisitor.getUsername() == newVisitor.getUsername());
    if(index<0)
      this.visitors.push(newVisitor);
  }

  clearVisitors(){this.visitors=[];}

  getTarget(){return this.target;}
  setTarget(a){this.target=a;}

  kill(){
    this.status="Dead";
    this.getPersonalChannel().lock();
    this.game.pushFreshDeath(this);
  }

  resurrect(){this.status="Alive";}

  getUsername(){return this.inGameName;}
  setUsername(a){this.inGameName = a;}

  getWinStatus(){return this.winStatus}
  setWinStatus(a){this.winStatus=a}

  getListNumber(){return this.listNumber}

  getVoteCount(){return this.voteCount;}
  setVoteCount(a){this.voteCount=a;}

  getConfiscatedValuables(){return this.confiscatedValuables;}

  getId(){return this.id;}

  pushChannel(a){this.channels.push(a)}

  getPersonalChannel(){
    return this.getChannels().filter(c=>c.getName()==="personal channel")[0];
  }

  getCauseOfDeath(){return this.causeOfDeath}
  pushCauseOfDeath(a){this.causeOfDeath.push(a);}
  emptyCauseOfDeath(){this.causeOfDeath=[];}

  getNotifs(){return this.notifications;}
  pushNotif(a){this.notifications.push(a);}
  clearNotifs(){this.notifications=[]}

  addLogToDiary(log){return this.diaryLogs.push(log)}
  getDiaryLogs(){return this.diaryLogs}
  clearDiaryLogs(){return this.diaryLogs=[]}

  getRole(){return this.role;}
  setRole(a){this.role=a;}

  getStatus(){return this.status;}
  setStatus(a){this.status = a;}

  getChannels(){return this.channels;}
  setChannels(a){this.channels=a;}
  
  getDiscord(){return this.discord;}

  getGame(){return this.game;}
  getGuild(){return this.guild}

}

module.exports = Player;