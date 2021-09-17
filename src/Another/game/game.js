const { PREFIX } = require('../variables/variables');
const Host = require('./host');
const Setup = require('./setup');
const Functions = require('../utility/functions');
const Clock = require('./clock');

class Game{

    id;
    host;
    setup;
    clock;
    server;
    functions;

    numberOfGhosts = 1;

    players = [];

    clockChannels= [];
    clockChannelKeys = [];

    connectedGuilds = [];


    //game related

    freshDeaths = [];
    votes = [];
    voteWinner=null;
    actions = [];

    
   

    prefix = PREFIX;

    numberOfGhosts = 1;

    constructor(message,server){
        this.id = `${message.guild.id}${message.author.id}`;
        this.server = server;
        this.host = new Host(message,this);
        this.setup = new Setup(this);
        this.clock = new Clock(this);
        this.functions = new Functions(this);
    }  


    async setupGame(){
        await this.setup.setupPlayers();
        await this.setup.createClockChannel();
        await this.setup.createClockChannelKeys();
        await this.setup.distributeClockChannelKeys();
        await this.clock.setupTownClock();
        await this.setup.setupPlayerListeners();
        await this.setup.showStartingChannels();
        // await this.getSetup().setupGuides();
        await this.host.notifyGameStart(this.players);
        this.clock.runHourGlass();
        this.clock.playLobby();
        return
    }

  

    async gameStart(){
        this.clock.setHourSand(0);
        this.clock.freezeHourGlass();
        await this.functions.lockStudentChannels();
        await this.functions.gameCountDown(3);
        await this.getClock().startGame();
        return
    }






    async quit(){
        this.getClock().terminateHourGlass();

        this.getClockChannels().forEach(clockChannel => {
            clockChannel.getDiscordConnection().delete();
        });

        
        this.getPlayers().forEach(async player => {
            player.getConfiscatedValuables().forEach(async valuable => {
                player.getDiscord().roles.add(valuable);
            });
            player.getChannels().forEach(async channel => {
                channel.getDiscordConnection().delete();
            });
        });

        this.clockChannelKeys.forEach(async key => {
            key.delete();
        });

        this.getHost().notifyGameEnd(this.players);
        this.server.removeGame(this.id);
    }
  
    // verifiers
    isHost(id){
        if(this.host.getGameHostId()===id)
            return true
        return false
    }

    //pushers
    pushClockChannel(a){this.clockChannels.push(a)}
    pushClockChannelKey(a){this.clockChannelKeys.push(a)}
    connectPlayer(a){this.players.push(a)}
    connectGuild(guild){
        const index = this.connectedGuilds.findIndex(connectedGuild => connectedGuild.id === guild.id);
        if(index<0)
        this.connectedGuilds.push(guild)
        return
    }
    pushVote(vote){
        const index = this.votes.findIndex(oldVote => oldVote.id === vote.id);
        if(index<0)
        this.votes.push(vote)
        return
    }
    pushChannelKey(key){
        const index = this.channelKeys.findIndex(oldKEy => oldKEy.id === key.id);
        if(index<0)
        this.channelKeys.push(key);
        return
    }
    pushAction(action){
        const index = this.actions.findIndex(oldAction => oldAction.user === action.user);
        if(index<0)
        this.actions.push(action)
        return
    }

    pushFreshDeath(freshlyDeadPlayer){
        const index = this.freshDeaths.findIndex(someFreshDead => someFreshDead.id === freshlyDeadPlayer.id);
        if(index<0)
        this.freshDeaths.push(freshlyDeadPlayer)
        return
    }

    // getters
    getId(){return this.id}
    getHost(){return this.host}
    getSetup(){return this.setup}
    getServer(){return this.server}

    getPlayers(){return this.players}
    getClockChannels(){return this.clockChannels;}
    getClockChannelKeys(){return this.clockChannelKeys}
    getConnectedGuilds(){return this.connectedGuilds}
    getFreshDeaths(){return this.freshDeaths;}
    getClock(){return this.clock}
    getFunctions(){return this.functions}
    getVotes(){return this.votes}
    getNumberOfGhosts(){return this.numberOfGhosts}
    getActions(){return this.actions}

    //array clearers
    clearVotes(){return this.votes=[]}
    clearActions(){return this.actions=[]}


}

module.exports = Game;