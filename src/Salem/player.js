const util = require("./utility");
const {MessageEmbed} = require('discord.js');
const roles = require("./roles");
const roledump = require("./roledump");
const Role = require("./role");

class Player{

  town;
  guild;
  exRoles = [];



  
  id;
  user;

  
  listnumber;
  username;
  maskName;

  role;
  maskRole;
  cleanedName;
  cleanedNotes="";
  disguiseStatus = false;
 
  status = "Alive";
  channels=[];
  isJailed=false;
  notes="";
  voteCount=1;
 
  causeOfDeath=[];
  jailStatus = false;
  douseStatus = false;
  seanceStatus = false;
  cleanStatus = false;
  
  judgement = [];
  killerNotes=[];
  notifications=[];
  buffs = [];
  visitors = [];
  target;
  muteStatus = false;
  winStatus = false;
  roleBlockStatus=false;

  Lwrap = `‎\n\`\`\`json\n`;
  Rwrap = `\`\`\``;

  constructor(town,listnumber,player,role){
    this.town=town;
    this.guild = player.guild;
    this.listnumber=listnumber+"";
    this.user = player.user;
    this.id = player.user.id;
    this.username = player.user.username;
    this.maskName = player.user.username;
    this.role = role;
    this.maskRole = role;
    this.user = this.guild.members.cache.get(this.id);
    let temp = roledump.list.filter(rr=>rr.Guild==this.guild.id);
    temp.forEach(rr => {
      rr.Roles.forEach(r => {
        if (this.user.roles.cache.some(role => role.id === r)) {
          let temp2 = this.user.roles.cache.get(r);
          this.exRoles.push(temp2);
        }
      });
    });
  }

  // ------------------------------------- FUNCTION DUMP

  listenForTheWin(){
    let winTriggers = this.getRole().getFriendlies();
    let alives = this.town.getPlayers().filter(p=>p.getStatus()=="Alive");
      if(winTriggers.length>0){
        let checker = alives.filter(p=>util.containsElement(winTriggers,p.getRole().getName()) || util.containsElement(winTriggers,p.getRole().getAlignment()) );
        if(checker.length==alives.length){
          alives.forEach(p => {
            if(p.getRole().getFriendlies().length>0){
              p.setWinStatus(true);
            }
          });
          
          if(this.getRole().getAlignment()!="Neutral"){
          let buddies = this.town.getPlayers().filter(p=>p.getRole().getAlignment()==this.getRole().getAlignment());
          buddies.forEach(b => {
            b.setWinStatus(true);
          });
          }
          this.town.getClock().setNextPhase("Game Over");
          this.town.getClock().skipPhase();
        }
      }
  }

  async resetMask(){
    if(!this.disguiseStatus){
      let face = roles.list.filter(r=>r.Name==this.getRole().getName());
      face = face[0];
      this.maskRole = new Role(face);
      this.maskName = this.username;
    }
    if(this.getStatus()=="Alive"){
      this.getMaskRole().setName(this.getCleanedName());
      if(this.getCleanedNotes().length>0){
        this.setNotes(this.getCleanedNotes());
      }
    }
  }

  async playDeath(){
    let message;
    
      await util.delay(2000);
      if(this.causeOfDeath.length>0){
        if(this.causeOfDeath[0]=="committed suicide"){
          return
        }else{
          if(this.causeOfDeath.length>1){
            message = `${this.getUsername()} was brutally murdered last night.`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
            await util.delay(1500);
          }else{
            message = `${this.getUsername()} died last night.`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
            await util.delay(3000);
          }

          for (let i = 0; i < this.causeOfDeath.length; i++) {
            if(i==0){
              message = `${this.getUsername()} was ${this.causeOfDeath[i]}`;
            }else{
              message = `${this.getUsername()} was also ${this.causeOfDeath[i]}`;
            }
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
            await util.delay(2000);
          }
          
          if(this.killerNotes.length>0){
            message = `${this.killerNote}`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
            await util.delay(2000);
          }
        }
      }

      await util.delay(2000);
      message = `${this.getUsername()}'s role was ${this.getRole().getName()}`;
      message = `${this.Lwrap}${message}${this.Rwrap}`;
      await this.town.getFunctions().messagePlayers(message);
      await util.delay(1000);

      if(this.getNotes().length>0){
        message = `We found a note beside ${this.getUsername()}'s body.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;

        for (const p of this.town.getPlayers()) {
          let notepad = await p.getHouse().getChannel().send(message);
          await notepad.react('📜');
          const filter = () => {return true;};
          let cover = notepad.createReactionCollector(filter,{dispose:true});
          cover.on('collect', async (reaction, user) => {
            if(!user.bot){
              switch(reaction.emoji.name){
                case "📜": 
                    message = `"${this.getNotes()}"\n\n- ${this.getUsername()}`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    notepad.edit(message);
                    await notepad.reactions.removeAll();
                    notepad.react('↩️');
                break;
                case "↩️": 
                    message = `We found a note beside ${this.getUsername()}'s body.`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    notepad.edit(message);
                    await notepad.reactions.removeAll();
                    notepad.react('📜');
                break;
              }
            }
          });
        }
        await util.delay(3000);
      }
  }

  async cleanHelpers(){
    this.getHouse().deleteHelper();
    this.getHouse().deletePhaseSign();
  }

  roleDetails(){
    let abilities = this.getRole().getAbilities();
    let ability_list="";
    for(let i=0;i<abilities.length;i++){
      ability_list+=`- ${abilities[i]}\n`;
    }
    let agrammar;
    if(abilities.length>1){
      agrammar = "Abilities";
    }else{
      agrammar = "Ability";
    }
    let goals = this.getRole().getGoals();
    let goals_list="";
    for(let i=0;i<goals.length;i++){
      goals_list+=`- ${goals[i]}\n`;
    }
    let ggrammar;
    if(goals.length>1){
      ggrammar = "Goals";
    }else{
      ggrammar = "Goal";
    }
    let commands = this.getRole().getCommands().filter(c=>c.getPermission()=="Role Holder");
    let commands_list="";
    for(let i=0;i<commands.length;i++){
      commands_list+=`${this.town.getPrefix()}${commands[i].getGuide()}\n`;
    }
    let cgrammar;
    if(commands.length>1){
      cgrammar = "Commands";
    }else{
      cgrammar = "Command";
    }
    let body = `**Alignment:** ${this.getRole().getAlignment()}\n**Type:** ${this.getRole().getType()}\n\n**${ggrammar}:**\n${goals_list}\n**${agrammar}:**\n${ability_list}\n**Skill ${cgrammar}:**\n${commands_list}`;
  
    return body;
  }

 

  async setupCollector(){
      let filter = m => m.author.bot && m.author.id != "818019699979190313" || m.author.id===this.getId();
      this.getChannels().forEach(channel => {
      channel.setCollector(channel.getChannel().createMessageCollector(filter));
      switch(channel.getName()){
        case "house":
          channel.getCollector().on('collect', async m => {
            await m.delete().catch();
            if(m.content.startsWith(this.town.getPrefix())){
              let args = util.exactString(this.town.getPrefix(),m.content);
              const cmd = args[0];
              const inputs = args[1];
              let body="";
              let footer="";
              let duration=0;

              let all_commands = this.getRole().getCommands();
              let phase = this.town.getClock().getPhase();
              let role_commands = all_commands.filter(c=>c.getStocks()>0 && c.getStatus()==this.getStatus() && util.containsElement(c.getPhase(),phase) && c.getPermission()=="Role Holder")
              let player_commands = all_commands.filter(c=>c.getPermission()=="Player" && util.containsElement(c.getPhase(),phase));
              let host_commands = all_commands.filter(c=>c.getPermission()=="Host" && util.containsElement(c.getPhase(),phase));
              let admin_commands = all_commands.filter(c=>c.getPermission()=="Admin" && util.containsElement(c.getPhase(),phase));
              let your_commands = [];
              
              your_commands.push(...role_commands);
              your_commands.push(...player_commands);

              if(this.town.getSetup().isHost(this.getId())){
                your_commands.push(...host_commands);
              }

              if(this.getId()=="481672943659909120"){
                your_commands.push(...admin_commands);
              }

              let keyword = cmd;

              let result = this.town.getFunctions().findCommand(your_commands,keyword);

              if(result){
                if(result.length==1){
                  let command = result[0];

                  if(command.getQueue() != "Instant"){ // role commands

                    if(command.getRequiredTargets()>0){
                      let inputs = args[1].join("");
                      inputs = util.splitComma(inputs);
    
                      let targetables = command.ValidTargets(this,this.town);
                      if(inputs.length==command.getRequiredTargets()){
                        let res = this.town.getFunctions().areValidTargets(this,command.getName(),inputs,targetables,this.town.getPlayers());
                        if(res){
                          let targets = res;
                          body = await command.ActionResponse(this,command,targets,this.town);
                          footer = `type .cancel to cancel this action.`;
                          let performer = command.Performer(this,command,this.town);
                          this.town.pushAction(this,performer,command,targets);
                        }
                      }else{
                        let targetGrammar;
                        if(command.getRequiredTargets()>1){targetGrammar = "targets";}
                        else{targetGrammar = "target";}
                        body = `Please enter **${command.getRequiredTargets()}** ${targetGrammar}.\n\nCommand: ${command.getGuide()}`;
                        if(command.getRequiredTargets()>1){
                          body+=`\n\n(Targets separated by a comma!)`
                        }
                      }
                    }else{
                      let targets = command.AutoTargets(this,this.town);
                      let performer = command.Performer(this,command,this.town);
                      body = await command.ActionResponse(this,command,targets,this.town);
                      this.town.pushAction(this,performer,command,targets);
                    }
                    if(body.length>0){
                      this.sendResponse(body,footer,duration);
                    }
                  }else{ // non role commands
                    command.Process(this,this.town,inputs);
                  }
                }else{
                  body = `There are multiple commands with the keyword "${cmd}":`;
                  result.forEach(c => {
                    body+=`\n- ${c.getName()}`;
                  });
                  footer = `Please re-enter your command and be more specific.`
                  this.getHouse().updateHelper(body,footer,duration);
                }
              }else{
                body = `Command either unavailable or not found.`;
                footer = `Type .help to see the list of commands.`
                this.getHouse().updateHelper(body,footer,duration);
              }

              

              
              








              











            //  -------------- NON  COMMANDS ----------------
            }else{
              let body="";
              let footer="";
              let duration=0;
              switch(this.town.getClock().getPhase()){
                case "In Lobby":
                case "Discussion": 
                case "Voting":
                case "Judgement":
                case "Execution":
                case "Defense":
                case "Game Over":
                  if(this.getStatus()=="Alive"){
                    if(!this.getMuteStatus()){
                      let msg = `‎\n**${this.getUsername()}:** ${m.content}`;
                      this.town.getFunctions().messagePlayers(msg);
                    }else{
                      let body = `‎You are being blackmailed. You can't talk right now.`;
                      this.sendResponse(body,"",0);
                    }
                  }else{
                    let msg = `‎\n**Ghost ${this.getUsername()}:** ${m.content}`;
                    this.town.getFunctions().messageGhosts(msg);
                  }
                  break;
                case "Final Words":
                  if(this.getStatus()=="Alive"){
                    let msg = `‎\n**${this.getUsername()}:** ${m.content}`;
                    this.town.getFunctions().messagePlayers(msg);
                  }else{
                    let msg = `‎\n**Ghost ${this.getUsername()}:** ${m.content}`;
                    this.town.getFunctions().messageGhosts(msg);
                  }
                break;
                case "Night":
                case "Night (Full Moon)":
                  if(!this.getSeanceStatus()){
                    if(this.getStatus()=="Alive"){
                      if(this.getJailStatus()){
                        let msg = `‎\n**${this.getUsername()} (Jailed):** ${m.content}`;
                        this.town.getJailor().getHouse().getChannel().send(msg);
                        this.getHouse().getChannel().send(msg);
                      }else{
                        if(this.getRole().getAlignment()==="Mafia"){
                          let mafias = this.town.getPlayers().filter(p=>p.getRole().getAlignment()==="Mafia");
                          mafias.forEach(mafia => {
                            mafia.getHouse().getChannel().send(`‎\n**${this.getUsername()} (${this.getRole().getName()}):** ${m.content}`);
                          });
                          let spies = this.town.getPlayers().filter(p=>p.getRole().getName()==="Spy");
                          if(spies.length>0){
                            spies.forEach(spy => {
                              spy.getHouse().getChannel().send(`‎\n**Mafia:** ${m.content}`);
                            });
                          }
                        }else
                         if(this.getRole().getName()=="Jailor"){
                          if(this.town.getJailedPerson()){
                            let msg = `‎\n**Jailor:** ${m.content}`;
                            this.town.getJailedPerson().getHouse().getChannel().send(msg);
                            this.getHouse().getChannel().send(msg);
                          }
                        }else if(this.getRole().getName()=="Medium"){
                          let msg = `‎\n**Medium:** ${m.content}`;
                          let dead = this.town.getPlayers().filter(p=>p.getStatus()=="Dead");
                          if(dead.length>0){
                            dead.forEach(d => {
                              d.getHouse().getChannel().send(msg);
                            });
                            this.getHouse().getChannel().send(msg);
                          }
                        }else{
                          body = `You can't talk at night.`
                          this.getHouse().updateHelper(body,footer,duration);
                        }
                      }
                    }else{
                      let msg = `‎\n**Ghost ${this.getUsername()}:** ${m.content}`;
                      this.town.getFunctions().messageGhosts(msg);
                      let mediums = this.town.getPlayers().filter(p=>p.getRole().getName()=="Medium" && p.getStatus()=="Alive");
                      if(mediums.length>0){
                        mediums.forEach(m => {
                          m.getHouse().getChannel().send(msg);
                        });
                      }
                    }
                  }else{
                    let msg = `‎\n**${this.getUsername()} (Seance):** ${m.content}`;
                    let seanced = this.town.getPlayers().filter(p=>p.getSeanceStatus());
                    seanced.forEach(s => {
                      s.getHouse().getChannel().send(msg)
                    });
                  }
                    
                break;
              }
            }
          });
        break;
        case "notepad":
          channel.getCollector().on('collect', async m => { 
            this.setNotes(m.content);
          });
          break;
      }
    });
  }

  async sendResponse(body,footer,duration){
    if(this.town.getClock().getHourSand()<duration){
      duration = this.town.getClock().getHourSand()*1000;
    }
    let embed = new MessageEmbed()
    .setColor("#000000")
    .setDescription(`${body}`)
    .setFooter(`${footer}`);
    await this.getHouse().getChannel().send("‎\n",embed).catch()
    .then(msg => {
      if(duration!=0){
        msg.delete({timeout: duration}).catch();
      } 
    });
  }

  // ------------------------------------- SETTERS / GETTERS

  

  setKillerNote(a){this.killerNote=a}
  getKillerNote(){return this.killerNote}

  getMuteStatus(){return this.muteStatus;}
  setMuteStatus(a){this.muteStatus=a;}

  setJailStatus(a){this.jailStatus=a}
  getJailStatus(){return this.jailStatus;}

  getCleanStatus(){return this.cleanStatus;}
  setCleanStatus(a){this.cleanStatus=a}

  getDouseStatus(){return this.douseStatus;}
  setDouseStatus(a){this.douseStatus=a}

  getSeanceStatus(){return this.seanceStatus;}
  setSeanceStatus(a){this.seanceStatus=a;}

  getRoleBlockStatus(){return this.roleBlockStatus;}
  setRoleBlockStatus(a){this.roleBlockStatus=a;}

  getJudgement(){return this.judgement;}
  pushJudgement(a){this.judgement.push(a);}
  removeJudgement(a){
    let index = this.judgement.findIndex(j => j == a);
    if(index>=0){this.judgement.splice(0,index);}
  }
  clearJudgement(){this.judgement=[];}

  getVisitors(){return this.visitors;}

  pushVisitor(a){
    let index = this.visitors.findIndex(v => v == a.getUsername());
    if(index>=0){
        this.visitors[index]=a;
    }else{
      this.visitors.push(a);
    }
  }

  clearVisitors(){this.visitors=[];}

  getTarget(){return this.target;}
  setTarget(a){this.target=a;}

  kill(){
    this.status="Dead";
    this.setWinStatus(false);
    this.getHouse().close();
    this.getNotepad().hideAndClose();
    this.town.pushFreshDeath(this);
  }

  calcBuff(target,performer,n1,n2){
    this.getBuffs().forEach(buff => {
      switch(buff){
        case "Heal":{
          n1.player = `You were attacked last night, but someone healed you back to health!`;
          let doctor = this.town.getActions().filter(a=>a.getFirstTarget().getId()==target.getId() && a.getPerformer().getRole().getName()=="Doctor");
          let n3 = {
              player: `Your target was attacked last night!`,
              spy: null
          }
          doctor.forEach(d => {
            if(d.getPerformer().getId()==target.getId()){
              n1.player=`You were attacked last night, but you healed yourself!`
            }else{
              d.getPerformer().pushNotif(n3);
            }
          });}
          break;
        case "Protect":{
            n1.player = `You were attacked last night, but someone protected you!`;
            n2.player = `Your target fought back!`,
            performer.pushNotif(n2);
            performer.kill();
            performer.pushCauseOfDeath(`killed by a Bodyguard.`);
            let bodyguard = this.town.getActions().filter(a=>a.getFirstTarget().getId()==target.getId() && a.getPerformer().getRole().getName()=="Bodyguard");
            let n4 = {
                player: `You protected your target from an attack last night!`,
                spy: null
            }
            bodyguard.forEach(b => {
              b.getPerformer().pushNotif(n4);
            });}
            break;
          case "Vest":
            n1.player = `Someone attacked you last night but you were immune!`;
            break;
      }
    });
    target.pushNotif(n1);
  }

  resurrect(){this.status="Alive";}

  getBuffs(){return this.buffs;}
  pushBuff(a){this.buffs.push(a);}
  clearBuffs(){this.buffs = [];}

  getUsername(){return this.username;}
  setUsername(a){this.username = a;}

  getVoteCount(){return this.voteCount;}
  setVoteCount(a){this.voteCount=a;}

  getMaskName(){return this.maskName;}
  setMaskName(a){this.maskName=a;}

  getDisguiseStatus(){return this.disguiseStatus;}
  setDisguiseStatus(a){this.disguiseStatus=a}

  getExRoles(){return this.exRoles;}

  getId(){
    return this.id;
  }

  pushDecision(a){
    if(this.decision.length==1){
      this.decision[0] = a;
      return true;
    }else{
      this.decision[0] = a;
      return false;
    }
  }

  getHouse(){
    return this.getChannels().filter(c=>c.getName()==="house")[0];
  }

  getNotepad(){
    return this.getChannels().filter(c=>c.getName()==="notepad")[0];
  }

  getNotes(){return this.notes;}
  setNotes(a){this.notes=a;}

  getWinStatus(){return this.winStatus;}
  setWinStatus(a){this.winStatus=a}

  getCauseOfDeath(){return this.causeOfDeath}
  pushCauseOfDeath(cause){
    this.causeOfDeath.push(cause);
  }
  emptyCauseOfDeath(){this.causeOfDeath=[];}

  setHouseSign(a){this.houseSign=a;}
  getHouseSign(){return this.houseSign;}

  getCleanedName(){return this.cleanedName;}
  setCleandName(a){this.cleanedName=a;}

  getListNumber(){return this.listnumber;}

  getJailed(){return this.jailed;}
  setJailed(a){this.jailed = a;}

  getNotifs(){return this.notifications;}
  pushNotif(a){this.notifications.push(a);}
  clearNotifs(){this.notifications=[]}

  getRole(){return this.role;}
  setRole(a){this.role=a;this.maskRole=a;}

  getStatus(){return this.status;}
  setStatus(a){this.status = a;}

  getChannels(){return this.channels;}
  setChannels(a){this.channels=a;}
  pushChannel(a){this.channels.push(a);}
  
  getRoleFlag(){return this.roleFlag;}
  setRoleFlag(a){this.roleFlag=a;}

  getTargets(){return this.targets;}
  pushTarget(a){this.targets.push(a);}

  getUser(){return this.user;}

  getCleanedNotes(){return this.cleanedNotes;}
  setCleanedNotes(a){this.cleanedNotes=a}

  getMaskRole(){return this.maskRole;}
  setMaskRole(a){this.maskRole=a;}

  getTown(){return this.town;}
  getGuild(){return this.guild}

}

module.exports = Player;