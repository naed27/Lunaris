const { PREFIX } = require('../variables/variables');
const Host = require('./host');
const Setup = require('./setup');
const Functions = require('../utility/functions');
const Clock = require('./clock');
const {delay} = require('../../Helpers/toolbox')

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

    freshDeaths = [];

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
    }

    async gameStart(){
        
        this.clock.setHourSand(0);
        this.clock.freezeHourGlass();
        await this.functions.lockStudentChannels();

        this.players.forEach(async player => {
            await this.functions.cleanChannel(player.getPersonalChannel().getDiscordConnection());
            player.getHouse().setTimer(await player.getPersonalChannel().getDiscordConnection().send(`‎Game will start in 15...`).catch());
        });

        for (let i = 15;i!=0;i--){
            await delay(1500);
            this.players.forEach(player =>{
                if(player.getHouse().getTimer()){
                    player.getHouse().getTimer().edit(`‎Game will start in ${i}...`).catch();
                }
            });
        }
        await delay(1500);

        this.players.forEach(player => {
            if(player.getHouse().getTimer()){
                player.getHouse().getTimer().delete();
                player.getHouse().setTimer(null);
            }
        });

        await this.getClock().startGame();
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
    
    getNumberOfGhosts(){return this.numberOfGhosts}

    //array pushers
    pushChannelKey(key){
        this.channelKeys.push(key);
    }




}

module.exports = Game;