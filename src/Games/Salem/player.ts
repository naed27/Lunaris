import { Guild, GuildMember, MessageReaction, Role as DiscordRole, TextChannel, User } from "discord.js";
import { MessageEmbed } from 'discord.js';
import roles from "./roles";
import Role from "./role";
import Game from "./game";
import { arrayContainsElement, createMarkDown, delay, parseCommand, splitStringByComma } from "../../Helpers/toolbox";
import PlayerChannelManager from "./channel/playerChannelManager";

interface ConstructorParams{
  game: Game,
  role: Role,
  listnumber: number,
  player: GuildMember,
  discord: User,
}

export default class Player{

  game: Game;
  guild: Guild;
  exRoles: DiscordRole[] = [];
  
  id: string;
  discord: User;
  
  listnumber: string;
  username: string;
  maskName: string;

  channel: TextChannel;
  channelManager: PlayerChannelManager;

  role: Role;
  maskRole: Role;
  cleanedName: string;
  cleanedNotes = "";
  disguiseStatus = false;
 
  notes = "";
  status = "Alive";
  isJailed = false;
  voteCount = 1;
  target: Player;
 
  causeOfDeath = [];
  jailStatus = false;
  douseStatus = false;
  cleanStatus = false;
  seanceStatus = false;
  
  buffs = [];
  visitors = [];
  judgement = [];
  killerNotes = [];
  winStatus = false;
  notifs = [];
  muteStatus = false;
  roleBlockStatus = false;

  constructor({ game, listnumber, player, role, discord}:ConstructorParams){
    this.game = game;
    this.role = role;
    this.maskRole = role;
    this.discord = discord;
    this.id = player.user.id;
    this.guild = player.guild;
    this.discord = player.user;
    this.listnumber = listnumber+'';
    this.username = player.user.username;
    this.maskName = player.user.username;
  }

  // ------------------------------------- FUNCTION DUMP

  listenForTheWin(alivePlayers:Player[]){
    const winBuddies = this.getRole().getWinBuddies();
    const aliveBuddies = alivePlayers.filter(( p ) => {
      const someonesAlignment = p.getRole().getAlignment();
      winBuddies.includes(someonesAlignment)
    });

    if(aliveBuddies.length===winBuddies.length){
      aliveBuddies.map((p)=>p.setWinStatus(true))
      this.game.getClock().gameOver();
    }
  }

  async resetMask(){
    if(!this.disguiseStatus){
      const face = roles.find(r=>r.name==this.getRole().getName());
      this.maskRole = new Role(face);
      this.maskName = this.username;
    }
    if(this.isAlive()){
      this.setNotes([]);
      this.getMaskRole().setName(this.cleanedName);
    }
  }

  sendToChannel = (message: string) => this.getChannel().send(message)

  showNote = async () => {
    if(this.getNotes().length===0) return 

    const message1 = `We found a note beside ${this.getUsername()}'s body.`;
    this.game.getPlayers().map(async (p)=>{
      const notepad = await p.getHouse().getChannel().send(message1);
      await notepad.react('📜');
      const filter = (reaction: MessageReaction, user: User) => !user.bot;
      const collector = notepad.createReactionCollector({filter, dispose:true});
      collector.on('collect', async (reaction: MessageReaction, user: User) => {
        const react = reaction.emoji.name;
        switch(react){
          case "📜": 
            const message2 = createMarkDown(`"${this.getNotes()}"\n\n- ${this.getUsername()}`);
            notepad.edit(message2);
            notepad.react('↩️');
          break;
          case "↩️": 
            const message3 = createMarkDown(`We found a note beside ${this.getUsername()}'s body.`);
            notepad.edit(message3);
            notepad.react('📜');
          break;
        }
        await notepad.reactions.removeAll();
      });
    });
    await delay(3000);
  }

  async playDeath(){
    await delay(2000);
    if(this.causeOfDeath.length>0){
      if(this.causeOfDeath[0]=="committed suicide"){
        return
      }else{
        const report = (this.causeOfDeath.length>1) 
        ? 'was brutally murdered last night.'
        : 'died last night.'

        const message1 = `${this.getUsername()} ${report}`;
        await this.game.getFunctions().sendMarkDownToPlayers(message1, 2000);

        for (let i = 0; i < this.causeOfDeath.length; i++) {
          const connector = i==0 ? 'was' : 'was also';
          const message2 = `${this.getUsername()} ${connector} ${this.causeOfDeath[i]}`;
          await this.game.getFunctions().sendMarkDownToPlayers(message2, 2000);
        }
      }
    }

    const message3 = `${this.getUsername()}'s role was ${this.getRole().getName()}`;
    await this.game.getFunctions().sendMarkDownToPlayers(message3,1000);

    this.showNote();
  }

  async cleanHelpers(){
    this.getHouse().deleteHelper();
    this.getHouse().deletePhaseSign();
  }


  async setupCollector(){
      let filter = m => m.author.bot && m.author.id != "818019699979190313" || m.author.id===this.getId();
      this.getChannels().forEach(channel => {
      channel.setCollector(channel.getChannel().createMessageCollector(filter));
      switch(channel.getName()){
        case "house":
          channel.getCollector().on('collect', async m => {
            await m.delete().catch();
            if(m.content.startsWith(this.game.getPrefix())){
              const {COMMAND, ARGS} = parseCommand(this.game.getPrefix(),m.content);
              const cmd = COMMAND;
              const inputs = splitStringByComma(ARGS.join(''));
              let body="";
              let footer="";
              let duration=0;

              let all_commands = this.getRole().getCommands();
              let phase = this.game.getClock().getPhase();
              let role_commands = all_commands.filter(c=>c.getStocks()>0 && c.getStatus()==this.getStatus() && arrayContainsElement(c.getPhase(),phase) && c.getPermission()=="Role Holder")
              let player_commands = all_commands.filter(c=>c.getPermission()=="Player" && arrayContainsElement(c.getPhase(),phase));
              let host_commands = all_commands.filter(c=>c.getPermission()=="Host" && arrayContainsElement(c.getPhase(),phase));
              let admin_commands = all_commands.filter(c=>c.getPermission()=="Admin" && arrayContainsElement(c.getPhase(),phase));
              let your_commands = [];
              
              your_commands.push(...role_commands);
              your_commands.push(...player_commands);

              if(this.game.getSetup().isHost(this.getId())){
                your_commands.push(...host_commands);
              }

              if(this.getId()=="481672943659909120"){
                your_commands.push(...admin_commands);
              }

              let keyword = cmd;

              let result = this.game.getFunctions().findCommand(your_commands,keyword);

              if(result){
                if(result.length==1){
                  let command = result[0];

                  if(command.getQueue() != "Instant"){ // role commands

                    if(command.getRequiredTargets()>0){
    
                      let targetables = command.ValidTargets(this,this.game);
                      if(inputs.length==command.getRequiredTargets()){
                        let res = this.game.getFunctions().areValidTargets(this,command.getName(),inputs,targetables,this.game.getPlayers());
                        if(res){
                          let targets = res;
                          body = await command.ActionResponse(this,command,targets,this.game);
                          footer = `type .cancel to cancel this action.`;
                          let performer = command.Performer(this,command,this.game);
                          this.game.pushAction(this,performer,command,targets);
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
                      let targets = command.AutoTargets(this,this.game);
                      let performer = command.Performer(this,command,this.game);
                      body = await command.ActionResponse(this,command,targets,this.game);
                      this.game.pushAction(this,performer,command,targets);
                    }
                    if(body.length>0){
                      this.sendResponse(body,footer,duration);
                    }
                  }else{ // non role commands
                    command.Process(this,this.game,inputs);
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
              switch(this.game.getClock().getPhase()){
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
                      this.game.getFunctions().messagePlayers(msg);
                    }else{
                      let body = `‎You are being blackmailed. You can't talk right now.`;
                      this.sendResponse(body,"",0);
                    }
                  }else{
                    let msg = `‎\n**Ghost ${this.getUsername()}:** ${m.content}`;
                    this.game.getFunctions().messageGhosts(msg);
                  }
                  break;
                case "Final Words":
                  if(this.getStatus()=="Alive"){
                    let msg = `‎\n**${this.getUsername()}:** ${m.content}`;
                    this.game.getFunctions().messagePlayers(msg);
                  }else{
                    let msg = `‎\n**Ghost ${this.getUsername()}:** ${m.content}`;
                    this.game.getFunctions().messageGhosts(msg);
                  }
                break;
                case "Night":
                case "Night (Full Moon)":
                  if(!this.getSeanceStatus()){
                    if(this.getStatus()=="Alive"){
                      if(this.getJailStatus()){
                        let msg = `‎\n**${this.getUsername()} (Jailed):** ${m.content}`;
                        this.game.getJailor().getHouse().getChannel().send(msg);
                        this.getHouse().getChannel().send(msg);
                      }else{
                        if(this.getRole().getAlignment()==="Mafia"){
                          let mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()==="Mafia");
                          mafias.forEach(mafia => {
                            mafia.getHouse().getChannel().send(`‎\n**${this.getUsername()} (${this.getRole().getName()}):** ${m.content}`);
                          });
                          let spies = this.game.getPlayers().filter(p=>p.getRole().getName()==="Spy");
                          if(spies.length>0){
                            spies.forEach(spy => {
                              spy.getHouse().getChannel().send(`‎\n**Mafia:** ${m.content}`);
                            });
                          }
                        }else
                         if(this.getRole().getName()=="Jailor"){
                          if(this.game.getJailedPerson()){
                            let msg = `‎\n**Jailor:** ${m.content}`;
                            this.game.getJailedPerson().getHouse().getChannel().send(msg);
                            this.getHouse().getChannel().send(msg);
                          }
                        }else if(this.getRole().getName()=="Medium"){
                          let msg = `‎\n**Medium:** ${m.content}`;
                          let dead = this.game.getPlayers().filter(p=>p.getStatus()=="Dead");
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
                      this.game.getFunctions().messageGhosts(msg);
                      let mediums = this.game.getPlayers().filter(p=>p.getRole().getName()=="Medium" && p.getStatus()=="Alive");
                      if(mediums.length>0){
                        mediums.forEach(m => {
                          m.getHouse().getChannel().send(msg);
                        });
                      }
                    }
                  }else{
                    let msg = `‎\n**${this.getUsername()} (Seance):** ${m.content}`;
                    let seanced = this.game.getPlayers().filter(p=>p.getSeanceStatus());
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
    if(this.game.getClock().getHourSand()<duration){
      duration = this.game.getClock().getHourSand()*1000;
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



  getMuteStatus = () => this.muteStatus
  setMuteStatus = (a:boolean) => this.muteStatus = a

  getJailStatus = () => this.jailStatus
  setJailStatus = (a:boolean) => this.jailStatus = a

  getJudgement = () => this.judgement
  pushJudgement = (a:string) => this.judgement.push(a);

  getCleanStatus = () => this.cleanStatus
  setCleanStatus = (a:boolean) => this.cleanStatus = a

  getDouseStatus = () => this.douseStatus
  setDouseStatus = (a:boolean) => this.douseStatus = a

  getSeanceStatus = () => this.seanceStatus
  setSeanceStatus = (a:boolean) => this.seanceStatus = a

  getRoleBlockStatus = () => this.roleBlockStatus
  setRoleBlockStatus = (a:boolean) => this.roleBlockStatus = a


  removeJudgement = (a:string) => {
    const index = this.judgement.findIndex(j => j == a);
    if(index>=0){this.judgement.splice(0,index);}
  }

  clearJudgement = () => this.judgement = []

  getVisitors = () => this.visitors

  pushVisitor = (a: Player) => {
    const index = this.visitors.findIndex(v => v == a.getUsername());
    if(index>=0)
      return this.visitors[index]=a;
    this.visitors.push(a);
  }

  clearVisitors = () => this.visitors = []

  getTarget = () => this.target
  setTarget = (a:Player) => this.target = a

  kill(){
    this.status="Dead";
    this.setWinStatus(false);
    this.getHouse().close();
    this.game.pushFreshDeath(this);
  }

  calcBuff(target,performer,n1,n2){
    this.getBuffs().forEach(buff => {
      switch(buff){
        case "Heal":{
          n1.player = `You were attacked last night, but someone healed you back to health!`;
          let doctor = this.game.getActions().filter(a=>a.getFirstTarget().getId()==target.getId() && a.getPerformer().getRole().getName()=="Doctor");
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
            let bodyguard = this.game.getActions().filter(a=>a.getFirstTarget().getId()==target.getId() && a.getPerformer().getRole().getName()=="Bodyguard");
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

  resurrect = () => this.status = 'Alive'

  getBuffs = () => this.buffs
  pushBuff = (a:string) => this.buffs.push(a);
  clearBuffs = () => this.buffs = []

  getUsername = () => this.username
  setUsername = (a:string) => this.username = a

  getVoteCount = () => this.voteCount
  setVoteCount = (a:number) => this.voteCount = a

  getMaskName = () => this.maskName
  setMaskName = (a:string) => this.maskName = a

  getDisguiseStatus = () => this.disguiseStatus
  setDisguiseStatus = (a:boolean) => this.disguiseStatus = a

  getChannelManager = () => this.channelManager;
  setChannelManager = (a: PlayerChannelManager) => this.channelManager = a;

  getId = () => this.id

  getExRoles = () => this.exRoles

  isAlive = () => this.status==='Alive'

  getNotes = () => this.notes
  setNotes = (a:string) => this.notes = a

  getWinStatus = () => this.winStatus
  setWinStatus = (a:boolean) => this.winStatus = a

  getCauseOfDeath = () => this.causeOfDeath

  pushCauseOfDeath = (a:string) => this.causeOfDeath.push(a);

  clearCauseOfDeath = () => this.causeOfDeath = []

  getCleanedName = () => this.cleanedName
  setCleandName = (a:string) => this.cleanedName = a

  getListNumber = () => this.listnumber

  getNotifs = () => this.notifs
  clearNotifs = () => this.notifs = []
  pushNotif = (a: Notif) => this.notifs.push(a);

  getRole = () => this.role
  setRole = (a:Role) => this.role = a

  getStatus = () => this.status
  setStatus = (a:string) => this.status = a

  getChannel = () => this.channel
  setChannel = (a: TextChannel) => this.channel = a;

  getDiscord = () => this.discord

  getCleanedNotes = () => this.cleanedNotes
  setCleanedNotes = (a:string) => this.cleanedNotes = a

  getMaskRole = () => this.maskRole
  setMaskRole = (a: Role) => this.maskRole = a

  getGame = () => this.game
  getGuild = () => this.guild


}
