import CloverClubServer from '../../Servers/CloverClubServer'
import { Guild, TextChannel, Role } from 'discord.js';
import Host from './host';
import Player from './player';
import Setup from './setup';
import GameChannelManager from './gameChannelManager';
import Clock from './clock';

interface ConstructorParams{
    server: CloverClubServer;
    guild: Guild;
}

export default class Game{

    title = 'Clover Club';

    id: string;
    host: Host;
    server: CloverClubServer;
    setup: Setup;
    gameKey: Role;

    guild: Guild;
    stageChannel: TextChannel;
    stageChannelManager:GameChannelManager;
    
    rolesToRemove=[];
    clock:Clock;

    prefix = ".";
    players:Player[]=[];
   
    channels=[];

    constructor({ server, guild }:ConstructorParams){
        this.guild = guild;
        this.server = server;
        this.id = `${guild.id}`;
        this.setup = new Setup(this);
        this.clock = new Clock(this);
    }  
    // ------------------------ Functions


    setupGame = async () => {
        await this.setup.setupPlayers();
        await this.setup.createGameKey();
        await this.setup.distributeKeys();
        await this.setup.setupStageChannel();
        await this.setup.setupPlayerListeners();
        await this.setup.showStageChannel();
        await this.setup.showPlayerChannels();
        await this.host.notifyGameStart();
        await this.clock.runTimer();
    }


    // ------------------------ Game Started

    gameStart = async () => { }
    
    // ------------------------ Setters and Getters


    getHost = () => this.host
    setHost = (a:Host) => this.host=a
    
    getPrefix = () => this.prefix
    setPrefix = (a:string) => this.prefix=a

    getTitle = () => this.title
    setGameKey = (key:Role) => this.gameKey = key

    getPlayers = () => this.players
    pushPlayer = (a:Player) => this.players.push(a)

    getChannels = () => this.channels
    pushChannel = (a:TextChannel) => this.channels.push(a)

    getRolesToRemove = () => this.rolesToRemove
    pushRoleToRemove = (a:Role) => this.rolesToRemove.push(a)
    
    getStageChannel = () => this.stageChannel;
    setStageChannel = (a:TextChannel) => this.stageChannel = a;

    getStageChannelManager = () => this.stageChannelManager;
    setStageChannelManager = (a:GameChannelManager) => this.stageChannelManager = a;

    lockPlayerChannels = () => this.players.map( ( p )=> p.getChannelManager().lock() );
    unlockPlayerChannels = () => this.players.map( ( p )=> p.getChannelManager().unlock() );

    getId = () => this.id;
    getSetup = () => this.setup;
    getClock = () => this.clock;
    getGuild = () => this.guild;
    getServer = () => this.server;
    getGameKey = () => this.gameKey;

    connectPlayer = (player:Player) => this.players.push(player)

    // ------------------------ Quitters

    quit = async () => {

        await this.gameKey.delete();
        await this.getHost().notifyGameEnd();

        this.getPlayers().map( p => p.getChannel().delete());
        this.getChannels().map( c => c.getChannel().delete());

        this.server.removeGame(this);

    }

}
