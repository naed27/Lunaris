import { arrayContainsElement, stringContainsKeyword, delay } from '../../Helpers/toolbox';
  
import { GuildMember, Guild, TextChannel, Role as DiscordRole } from 'discord.js';
import Role from './role';
import Game from './game';
import PlayerChannelManager from './channel/playerChannelManager';
import Notif from './notif';

interface ConstructorParams{
  game: Game,
  role: Role,
  listnumber: number,
  discord: GuildMember,
  channel: TextChannel,
}

export default class Player{

  game: Game;
  guild: Guild;
  exRoles: DiscordRole[] = [];

  id: string;
  discord: GuildMember;
  
  username: string;
  maskName: string;
  listnumber: string;

  role: Role;
  voteCount = 1;

  notes = '';
  status: 'Alive' | 'Dead' = 'Alive';

  channel: TextChannel;
  channelManager: PlayerChannelManager;
 
  visitors = [];
  judgement = [];
  diaryLogs = [];
  causeOfDeath=[];
  notifications = [];
  confiscatedValuables = [];

  winStatus = false;
  jailStatus = false;
  muteStatus = false;


 constructor({ game, listnumber, channel, role, discord }: ConstructorParams){
    this.game = game;
    this.role = role;
    this.discord = discord;
    this.channel = channel;
    this.id = discord.user.id;
    this.guild = discord.guild;
    this.listnumber = listnumber + '';
    this.username = discord.user.username;

    // this.role.setPlayer(this);
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
      this.game.getClock().endGame();
    }
  }

  playDeath = async () => {
    
    await delay(2000);
    if(this.causeOfDeath.length>0){
      if(this.causeOfDeath[0] === 'committed suicide') return
      
      const introMessage = this.causeOfDeath.length>1 ?
        `${this.getUsername()} was brutally murdered last night.` :
        `${this.getUsername()} died last night.`;
   
      await this.game.getFunctions().messagePlayersWrapped(introMessage);
      await delay(3000);

      this.causeOfDeath.forEach(async (cause) => {
        await this.game.getFunctions().messagePlayersWrapped(cause);
        await delay(2000);
      });
    }

    await delay(3000);
  }


  getCommands = () => { 
    
    const phase = this.game.getClock().getPhase();
    
    const playerIsHost = this.game.isHost(this);
    const playerIsAdmin = this.game.isAdmin(this);

    const availableCommands = this.getRole().getCommands().map((command)=>{

      const phases = command.getPhases();
      const stocks = command.getStocks();
      const playerStatus = this.getStatus();
      const commandStatus = command.getStatus();
      const permission = command.getPermission().toLowerCase();

      const hasStocks = stocks > 0;
      const isHostCommand = permission === 'host';
      const isAdminCommand = permission === 'admin';
      const matchCurrentPhase = phases.includes(phase.name);
      const matchPlayerStatus = commandStatus
        .map((status) => status.toLowerCase())
        .includes(playerStatus.toLowerCase())

      if(!hasStocks) return;
      if(!matchCurrentPhase) return;
      if(!matchPlayerStatus) return;
      if(isHostCommand && !playerIsHost) return
      if(isAdminCommand && !playerIsAdmin) return 

      return command;
    });

    return availableCommands;
  }

  findCommand = (keyword: string) => {

    const commands = this.getCommands();

    const exactFound = commands.filter((command) => command.name === keyword);
    if(exactFound.length>0)return exactFound;

    const startWiths = commands.filter(command => command.name.toLowerCase().startsWith(keyword.toLowerCase()));
    if(startWiths.length>0)return startWiths;

    const keysFound = commands.filter(command => stringContainsKeyword(command.name,keyword));
    if(keysFound.length>0)return keysFound;

    const initialsFound = commands.filter(command => stringContainsKeyword(command.name,keyword));
    if(initialsFound.length>0)return initialsFound;

    return [];
  }

  // ----------------- Setters and Getters

  getVisitors = () => this.visitors = [];
  pushVisitor = (newVisitor: Player) => {
    const index = this.visitors.findIndex(oldVisitor => oldVisitor.getUsername() == newVisitor.getUsername());
    if ( index<0 ) this.visitors.push( newVisitor );
  }
  clearVisitors = () => this.visitors = [];

  kill(){
    this.status='Dead';
    this.channelManager.lock();
    this.game.pushFreshDeath(this);
  }

  resurrect = () => this.status = 'Alive';

  getUsername = () => this.username;
  setUsername = (a: string) => this.username = a;
  
  isWinner = () => this.winStatus === true;
  setWinStatus = (a: boolean) => this.winStatus = a;

  isMuted = () => this.muteStatus === true;
  setMuteStatus = (a: boolean) => this.muteStatus = a;

  getListNumber = () => this.listnumber;

  getVoteCount = () => this.voteCount;
  setVoteCount = (a: number) => this.voteCount = a;

  getConfiscatedValuables(){return this.confiscatedValuables;}

  getId = () => this.id

  getCauseOfDeath = () => this.causeOfDeath
  pushCauseOfDeath = (a: string) => this.causeOfDeath.push(a);
  clearCauseOfDeath = () => this.causeOfDeath = [];

  getNotifs = () => this.notifications
  pushNotif = (a: Notif) => this.notifications.push(a);
  clearNotifs = () => this.notifications = [];

  getRole = () => this.role;
  setRole = (a: Role) => this.role = a;

  getRoleName = () => this.role.getName();
  roleNameIs = (a: string) => this.role.getName() === a;
  
  getStatus = () => this.status
  setStatus = (a: 'Alive' | 'Dead') => this.status = a;
  isAlive = () => this.status === 'Alive';

  getChannel = () => this.channel
  setChannel = (a: TextChannel) => this.channel = a;

  getChannelManager = () => this.channelManager;
  setChannelManager = (a: PlayerChannelManager) => this.channelManager = a;
  
  getDiscord = () => this.discord

  getGame = () => this.game;
  getGuild = () => this.guild;
}
