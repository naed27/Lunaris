import CloverClubServer from '../../Servers/CloverClubServer'
import { Guild, User, TextChannel, Role } from 'discord.js';
import Host from './host';
import { delay } from '../../Helpers/toolbox';
import Player from './player';
import Setup from './setup';

interface ConstructorParams{
    server: CloverClubServer;
    guild: Guild;
}

export default class Game{

    title = 'Clover Club';

    id:string;
    host:Host;
    server:CloverClubServer;
    setup:Setup;
    gameKey:Role;

    guild:Guild;
    

    rolesToRemove=[];
    phase = 'lobby';

    prefix = ".";
    players:Player[]=[];
   
    channels=[];

    constructor({server,guild}:ConstructorParams){
        this.guild = guild;
        this.server = server;
        this.id = `${guild.id}`;
        this.setup = new Setup(this);
    }  
    // ------------------------ Functions

    getTitle = () => this.title
    setGameKey = (key:Role) => this.gameKey = key;

    setupGame = async () => {
        await this.getSetup().setupPlayers();
        await this.getSetup().createGameKey();
        // await this.getSetup().passRoles();
        // await this.getSetup().setupClockChannel();
        // await this.getClock().setupTownClock();
        // await this.getSetup().setupPlayerCollectors();
        // await this.getSetup().showStartingChannels();
        // await this.getSetup().setupGuides();
        // await this.getSetup().setupExeTarget();
        // await this.getHost().notifyGameStart();
        // await this.getClock().theHourGlass();
        // await this.getClock().playLobby();
    }


    // ------------------------ Game Started

    gameStart = async () => { }
    
    // ------------------------ Setters and Getters

    connectPlayer = (player:Player) => this.players.push(player)

    getHost = () => this.host
    setHost = (a:Host) => this.host=a
    
    getPrefix = () => this.prefix
    setPrefix = (a:string) => this.prefix=a

    getPhase = () => this.phase;
    setPhase = (phase:string) => this.phase = phase;

    getPlayers = () => this.players
    pushPlayer = (a:Player) => this.players.push(a)

    getChannels = () => this.channels
    pushChannel = (a:TextChannel) => this.channels.push(a)

    getRolesToRemove = () => this.rolesToRemove
    pushRoleToRemove = (a:Role) => this.rolesToRemove.push(a)


    getId = () => this.id;
    getSetup = () => this.setup;
    getGuild = () => this.guild;
    getServer = () => this.server;
    getGameKey = () => this.gameKey;

    // ------------------------ Quitters

    async quit(){

        await this.gameKey.delete();
        await this.getHost().notifyGameEnd();

        this.getPlayers().map( p => p.getChannel().delete());
        this.getChannels().map( c => c.getChannel().delete());

        this.server.removeGame(this);

    }

}
