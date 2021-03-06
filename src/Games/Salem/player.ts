import { ButtonInteraction, CacheType, Collection, Guild, GuildMember, Interaction, InteractionCollector, Message, MessageActionRow, MessageEmbed, MessageReaction, Role as DiscordRole, SelectMenuInteraction, TextChannel, User } from 'discord.js';
import roles, { SalemRoleName } from './roles';
import Role from './role';
import Game, { JudgementChoices } from './game';
import { arrayContainsElement, createEmbed, jsonWrap, delay, createChoices } from '../../Helpers/toolbox';
import PlayerChannelManager from './channel/playerChannelManager';
import Notif from './notif';
import Command from './command';
import { CommandParams } from './channel/commandCallHandlers';

interface ConstructorParams{
  game: Game,
  role: Role,
  listnumber: number,
  discord: GuildMember,
  channel: TextChannel,
}

type PlayerBuff = 'Vest' | 'Heal' | 'Protect' | 'Alert'
type PlayStatus = 'Ready' | 'Not Ready' | 'Playing' | 'Disconnected'
type InteractionCollectorType = 
  InteractionCollector<ButtonInteraction<CacheType> | ButtonInteraction<"cached">> |
  InteractionCollector<SelectMenuInteraction<CacheType> | SelectMenuInteraction<'cached'>>;

export default class Player{

  game: Game;
  guild: Guild;
  exRoles: DiscordRole[] = [];
  
  id: string;
  discord: GuildMember;
  
  listnumber: string;
  username: string;
  maskName: string;
  playStatus: PlayStatus = 'Not Ready';


  channel: TextChannel;
  linebreak = `‎\n`;
  channelManager: PlayerChannelManager;
  interactionCollectors: InteractionCollectorType[] = [];
  skillMessage: Message;
  voteMessage: Message;

  role: Role;
  maskRole: Role;
  cleanedName: string;
  cleanedNotes = '';
  disguiseStatus = false;
 
  notes = '';
  status: 'Alive' | 'Dead' = 'Alive';

  voteCount = 1;
  judgement: JudgementChoices = 'Abstain';
 
  causeOfDeath = [];
  winStatus = false;
  jailStatus = false;
  douseStatus = false;
  cleanStatus = false;
  seanceStatus = false;
  blackmailStatus = false;
  roleBlockStatus = false;
  
  buffs: PlayerBuff[] = [];
  visitors = [];
  killerNotes = [];
  notifs: Notif[] = [];
  executionerTarget: Player;
  firstActionTarget: Player | 'None' = 'None';
  secondActionTarget: Player | 'None' = 'None';


  constructor({ game, listnumber, channel, role, discord }: ConstructorParams){
    this.game = game;
    this.role = role;
    this.maskRole = role;
    this.discord = discord;
    this.channel = channel;
    this.role.setPlayer(this);
    this.id = discord.user.id;
    this.guild = discord.guild;
    this.listnumber = listnumber+'';
    this.username = discord.user.username;
    this.maskName = discord.user.username;
    this.channelManager = new PlayerChannelManager({
      game: game,
      player: this,
      channel: channel,
      defaultId: discord.user.id,
    });
  }

  // ------------------------- Functions 

  listenForTheWin = () => this.winStatus = this.role.winListener({ game:this.game, user:this })
  
  resetMask = () => {
    if(!this.disguiseStatus){
      const face = roles.find(r=>r.name==this.getRole().getName()); 
      this.maskRole = new Role(face);
      this.maskName = this.username;
    }
  }

  resetYesterdayStatus = () => {
    this.clearActionTargets();
    this.resetMask();
    this.clearBuffs();
    this.clearVisitors();
    this.resetJudgement();
    this.setSeanceStatus(false);
    this.setJailedStatus(false);
    this.setRoleBlockStatus(false);
  }

  showNote = async () => {
    if(this.getNotes().length===0) return 

    const message1 = `We found a note beside ${this.getUsername()}'s body.`;
    this.game.getPlayers().map(async (p)=>{
      const notepad = await p.getChannel().send(message1);
      await notepad.react('📜');
      const filter = (reaction: MessageReaction, user: User) => !user.bot;
      const collector = notepad.createReactionCollector({filter, dispose:true});
      collector.on('collect', async (reaction: MessageReaction, user: User) => {
        const react = reaction.emoji.name;
        switch(react){
          case '📜': 
            const message2 = jsonWrap(`'${this.getNotes()}'\n\n- ${this.getUsername()}`);
            notepad.edit(message2);
            notepad.react('↩️');
          break;
          case '↩️': 
            const message3 = jsonWrap(`We found a note beside ${this.getUsername()}'s body.`);
            notepad.edit(message3);
            notepad.react('📜');
          break;
        }
        await notepad.reactions.removeAll();
      });
    });
    await delay(3000);
  }

  playDeath = async () => {
    await delay(2000);
    if(this.causeOfDeath.length>0){
      if(this.causeOfDeath[0]=='committed suicide'){
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
    this.causeOfDeath = [];
    const message3 = `${this.getUsername()}'s role was ${this.getRole().getName()}`;
    await this.game.getFunctions().sendMarkDownToPlayers(message3,1000);
    this.showNote();
  }

  playResurrection = async () => {
    await delay(1000);
    const  msg = `${this.getUsername()} has been resurrected!`;
    await this.messagePlayers(jsonWrap(msg));
    await delay(1000);
  }

  cleanHelpers = async () => {
    this.getChannelManager().manageWelcomeGuide().delete();
    this.getChannelManager().managePhaseCommands().delete();
  }

  getCommands = () => this.getRole().getCommands();
  getHostCommands = () => this.getCommands().map(c => c.getType() === 'Host Command');
  getAdminCommands = () => this.getCommands().map(c => c.getType() === 'Admin Command');
  getSkillCommands = () => this.getCommands().map(c => c.getType() === 'Skill Command');
  getActionCommands = () => this.getCommands().map(c => c.getType() === 'Action Command');
  getUniversalCommands = () => this.getCommands().map(c => c.getType() === 'Universal Command');

  getAvailableCommands = () => { 
    
    const phase = this.game.getClock().getPhase();
    
    const playerIsHost = this.game.isHost(this);
    const playerIsAdmin = this.game.isAdmin(this);

    const availableCommands = this.getRole().getCommands().filter((command)=>{

      const phases = command.getPhases();
      const stocks = command.getStocks();
      const playerStatus = this.getStatus();
      const commandStatus = command.getRequiredStatus();
      const commandType = command.getType()

      const hasStocks = stocks > 0;
      const isHostCommand = commandType === 'Host Command';
      const isAdminCommand = commandType === 'Admin Command';
      const isPlayerCommand = commandType === 'Skill Command';
      const matchCurrentPhase = phases.includes(phase.name);
      const matchPlayerStatus = commandStatus
        .map((status) => status.toLowerCase())
        .includes(playerStatus.toLowerCase())

      if(!hasStocks) return false;
      if(!matchCurrentPhase) return false;
      if(!matchPlayerStatus) return false;
      if(isHostCommand && !playerIsHost) return false;
      if(isAdminCommand && !playerIsAdmin) return false;
      if(isPlayerCommand && this.isJailed()) return false;

      return true;
    });
    
    return availableCommands;
  }

  getAvailableSkillCommands = () => this.getAvailableCommands().filter( c => c.getType() === 'Skill Command');
  getAvailableActionCommands = () => this.getAvailableCommands().filter( c => c.getType() === 'Action Command');

  sendMessageCatcher = () => console.log(`Error: Could not send message to ${this.getUsername()}'s channel.`)
  sendMessageToChannel = async (message: string) =>  await this.getChannel().send(`${this.linebreak}${message}`).catch(this.sendMessageCatcher)
  sendMarkDownToChannel = async (message: string) =>  await this.getChannel().send(jsonWrap(message)).catch(this.sendMessageCatcher)
  sendEmbedToChannel = async (embed: MessageEmbed) =>  await this.getChannel().send({embeds:[embed]}).catch(this.sendMessageCatcher)


  sendCallResponse = async ({command, commandParams}: {command: Command, commandParams: CommandParams}) => {
    const response = await command.callResponse(commandParams)
    const isSkillCommand = command.getType() === 'Skill Command';
    const isVoteCommand = command.getName() === 'vote';

    if(typeof response === 'string'){
      const buttonLabel = (()=>{
        if(isSkillCommand) return 'Cancel'
        if(isVoteCommand) return 'Unvote'
        return 'Null'
      })()
      const button = buttonLabel!== 'Null' ? [createChoices({choices:[buttonLabel]})] : [];
      
      const message = await this.getChannel()
        .send({content:jsonWrap(response),components: [...button]})
        .catch(this.sendMessageCatcher)

      if(!message) return
      const filter = (i:Interaction) => i.user.id === this.getId();
      const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON' });
      collector.on('collect', async (i) => {
        i.deferUpdate()
        const choice = i.customId;
        switch(choice){
          case 'Cancel': this.game.removeActionOf(this) && this.alert('Your action has been cancelled.');break;
          case 'Unvote': this.game.removeVoteOf(this) && this.alert('Your vote has been removed.');break;
          default: break;
        }
        message.edit({ components: [] });
      });
      this.pushInteractionCollector(collector)
      if(isVoteCommand) this.updateVoteMessage(message);
      if(isSkillCommand) this.updateSkillMessage(message);
    }
  }

  updateSkillMessage = (message:Message) => {
    if(this.skillMessage)
      this.skillMessage.edit({components:[]})
    this.skillMessage = message
  }

  updateVoteMessage = (message:Message) => {
    if(this.voteMessage)
      this.voteMessage.edit({components:[]})
    this.voteMessage = message
  }

  cleanMessageComponents = () => {
    if(this.skillMessage)
      this.skillMessage.edit({components:[]})
    if(this.voteMessage)
      this.voteMessage.edit({components:[]})
  }

  alert = async (msg: string) => await this.sendEmbedToChannel(createEmbed({description: msg}))

  sendEmbedWithMenu = async ({description, menu}:{description: string, menu: MessageActionRow}) =>
    await this.getChannel().send({content:this.linebreak,embeds: [createEmbed({description})], components: [menu],}).catch(() => console.log(`Error: Could not send embed to ${this.getUsername()}'s channel.`))
  
  messagePlayers = async (msg:string) => this.game.getPlayers().map((p)=>p.getChannelManager().sendString(msg))

  messageAlivePlayers =  async (msg: string) => {
    this.game.getPlayers().map((p)=>p.isAlive() && p.getChannelManager().sendString(msg))
  }

  messageGhosts = async (msg: string) => {
    this.game.getPlayers().map((p)=>!p.isAlive() && p.getChannelManager().sendString(msg))
  }

  messageJailedPlayers = async (msg: string) => {
    this.game.getPlayers().map((p)=>p.isJailed() && p.getChannelManager().sendString(msg))
  } 

  messageJailor = async (msg: string) => {
    this.game.getPlayers().map((p)=>p.getRoleName() === 'Jailor' && p.getChannelManager().sendString(msg))
  } 

  messageSpies  = async (msg: string) => {
    this.game.getPlayers().map((p)=>p.getRoleName() === 'Spy' && p.getChannelManager().sendString(msg))
  }

  messageMafias = async (msg: string) => {
    this.game.getMafias().map( p => p.getChannelManager().sendString(msg))
  }

  messageOtherMafias = async (msg: string) => {
    this.game.getMafias().filter( m => m.getId() !== this.getId())
    .map((m)=>m.getChannelManager().sendString(msg))
  }

  messagePlayersWrapped = async (msg: string) => {
    const content = jsonWrap(msg);
    this.game.getPlayers().map((p)=>p.getChannelManager().sendString(content));
  }

  cleanChannel = async () => {
    let fetched: Collection<string, Message<boolean>>;
    this.getChannelManager().manageWelcomeGuide().clearCache();
    this.getChannelManager().managePhaseMenu().clearCache();
    this.getChannelManager().manageClock().clearCache();
    this.getChannelManager().manageCountDown().clearCache();
    this.getChannelManager().manageJudgement().clearCache();
    this.getChannelManager().managePlayerList().clearCache();
    this.getChannelManager().managePlayersRole().clearCache();
    this.getChannelManager().managePhaseCommands().clearCache();
    this.getChannelManager().manageAvailableCommands().clearCache();
    do {
      fetched = await this.channel.messages.fetch({limit: 100});
      await this.channel.bulkDelete(fetched).catch();
    }
    while(fetched.size >= 2);
  }

  // ------------------------- Setters & Getters

  getMuteStatus = () => this.blackmailStatus
  setMuteStatus = (a:boolean) => this.blackmailStatus = a

  getJailStatus = () => this.jailStatus
  setJailStatus = (a:boolean) => this.jailStatus = a

  getJudgement = () => this.judgement;
  setJudgement = (a: JudgementChoices) => this.judgement = a;
  resetJudgement = () => this.judgement = 'Abstain';

  getCleanStatus = () => this.cleanStatus
  setCleanStatus = (a:boolean) => this.cleanStatus = a

  getDouseStatus = () => this.douseStatus
  setDouseStatus = (a:boolean) => this.douseStatus = a

  getSeanceStatus = () => this.seanceStatus
  setSeanceStatus = (a:boolean) => this.seanceStatus = a

  isRoleBlocked = () => this.roleBlockStatus === true
  isNotRoleBlocked = () => this.roleBlockStatus === false
  setRoleBlockStatus = (a:boolean) => this.roleBlockStatus = a

  isBlackmailed = () => this.blackmailStatus === true;
  setBlackmailStatus = ( a: boolean ) => this.blackmailStatus = a
  
  getExecutionTarget = () => this.executionerTarget;
  setExecutionerTarget = (a: Player) => this.executionerTarget = a;

  getVisitors = () => this.visitors

  pushVisitor = (a: Player) => {
    const index = this.visitors.findIndex(v => v == a.getUsername());
    if(index>=0)
      return this.visitors[index]=a;
    this.visitors.push(a);
  }

  clearVisitors = () => this.visitors = []

  kill(){
    this.status='Dead';
    this.winStatus = false;
    this.channelManager.lock();
    this.game.pushFreshDeath(this);
  }

  calculateBuff({killer, targetNotif, killerNotif}:{killer: Player, targetNotif: Notif, killerNotif: Notif}){
    this.getBuffs().forEach(buff => {
      switch(buff){
        case 'Heal':
          const selfHeal = this.game.getActions().filter(a=>a.isSelfTarget() && a.getPerformer().roleNameIs('Doctor'));
          const inbox = selfHeal ?
            `You were attacked last night, but you healed yourself!` : 
            `You were attacked last night, but someone healed you back to health!`
          const newsForSpy = `Your target was attacked last night!`
          targetNotif.setInbox(inbox);
          targetNotif.setNewsForSpy(newsForSpy);
        break;

        case 'Protect':{
          killerNotif.setInbox(`Your target fought back!`)
          killer.kill();
          killer.pushCauseOfDeath(`killed by a Bodyguard.`);
          targetNotif.setInbox(`You were attacked last night, but someone protected you!`)
          const bodyguards = this.game.getActions()
          .filter(a => {
            const firstTarget = a.getFirstTarget();
            if(firstTarget === 'None') return false
            firstTarget.getId() === this.getId() && 
            a.getPerformer().getRoleName()=='Bodyguard'
          })
          .map((bodyguardAction) => bodyguardAction.getPerformer());
          const bodyguardNotif = new Notif({ inbox: `You protected your target from an attack last night!` })
          bodyguards.forEach( bg => bg.pushNotif(bodyguardNotif))}
        break;

        case 'Vest':
          targetNotif.setInbox(`Someone attacked you last night but you were immune!`);
          killerNotif.setInbox(`You attacked your target last night but they were immune!`);
        break;
      }
    });
    this.pushNotif(targetNotif);
    killer.pushNotif(killerNotif);
  }

  resurrect = () => this.status = 'Alive'

  getBuffs = () => this.buffs
  pushBuff = (a:PlayerBuff) => this.buffs.push(a);
  clearBuffs = () => this.buffs = []

  getUsername = () => this.username
  setUsername = (a:string) => this.username = a

  getVoteCount = () => this.voteCount
  setVoteCount = (a:number) => this.voteCount = a

  getMaskName = () => this.maskName
  setMaskName = (a:string) => this.maskName = a

  isDisguised = () => this.disguiseStatus === true;
  isNotDisguised = () => this.disguiseStatus === false;
  getDisguiseStatus = () => this.disguiseStatus
  setDisguiseStatus = (a:boolean) => this.disguiseStatus = a

  getChannelManager = () => this.channelManager;
  setChannelManager = (a: PlayerChannelManager) => this.channelManager = a;

  isJailed = () => this.jailStatus === true;
  isNotJailed = () => this.jailStatus === false;
  setJailedStatus = (a: boolean) => this.jailStatus = a;

  isMafia = () => this.getRole().getAlignment() === 'Mafia';
  isNotMafia = () => this.getRole().getAlignment() !== 'Mafia';

  getId = () => this.id

  getExRoles = () => this.exRoles

  isAlive = () => this.status === 'Alive';
  isDead = () => this.status === 'Dead';
  isVotedUp = () => this.game.getVotedUp().getId() === this.id;
  isNotVotedUp = () => this.game.getVotedUp().getId() !== this.id;

  getNotes = () => this.notes
  setNotes = (a:string) => this.notes = a

  getWinStatus = () => this.winStatus
  setWinStatus = (a:boolean) => this.winStatus = a
  isWinner = () => this.winStatus === true;
  isLoser = () => this.winStatus === false;

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
  getRoleName = () => this.role.getName();

  getStatus = () => this.status
  setStatus = (a:'Alive' | 'Dead') => this.status = a

  getChannel = () => this.channel
  setChannel = (a: TextChannel) => this.channel = a;

  getDiscord = () => this.discord

  getCleanedNotes = () => this.cleanedNotes
  setCleanedNotes = (a:string) => this.cleanedNotes = a

  getMaskRole = () => this.maskRole
  setMaskRole = (a: Role) => this.maskRole = a

  getGame = () => this.game
  getGuild = () => this.guild

  isImmuneTo = (a: string) => arrayContainsElement(this.role.getImmunities(),a);
  isNotImmuneTo = (a: string) => !this.isImmuneTo(a);

  roleNameIs = (a: SalemRoleName) => this.getRoleName() === a;
  alignmentIs = (a: string) => this.getRole().getAlignment() === a;
  alignmentIsNot = (a: string) => this.getRole().getAlignment() !== a;

  setFirstActionTarget = (a:  Player | 'None') => this.firstActionTarget = a

  setSecondActionTarget = (a:  Player | 'None') => this.secondActionTarget = a

  getFirstActionTarget = () => this.firstActionTarget
  
  getSecondActionTarget = () => this.secondActionTarget

  getActionTargets = () => {
    const targets = [];
    if(this.firstActionTarget !== null) targets.push(this.firstActionTarget);
    if(this.secondActionTarget !== null) targets.push(this.secondActionTarget);
    return targets;
  }

  clearActionTargets = () => {
    this.firstActionTarget = null
    this.secondActionTarget = null
  }

  setInteractionCollectors = ( collectors : InteractionCollectorType[]) => {
    this.interactionCollectors = collectors;
  }

  pushInteractionCollector = ( collector : InteractionCollectorType | InteractionCollectorType[]) => {
    if(collector.constructor === Array) 
      this.interactionCollectors.push(...collector)
    if(typeof collector === 'string')
      this.interactionCollectors.push(collector)
  }

  getInteractionCollectors = () => this.interactionCollectors;

  endAllActionInteractions = () =>{
    this.interactionCollectors.forEach(collector => collector.stop())
    this.interactionCollectors = [];
  }

  setPlayStatus = (a: PlayStatus) => this.playStatus = a;
  getPlayStatus = () => this.playStatus
  isReady = () => this.playStatus === 'Ready';
  isNotReady = () => this.playStatus === 'Not Ready';
  isPlaying = () => this.playStatus === 'Playing';
  isDisconnected = () => this.playStatus === 'Disconnected';
}
