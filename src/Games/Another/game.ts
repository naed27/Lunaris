import { Guild, Role as DiscordRole } from 'discord.js';
import Functions from './functions';
import Clock from './clock';
import Player from './player';
import AnotherServer from '../../Servers/AnotherServer'
import { createEmbed, delay, jsonWrap } from '../../Helpers/toolbox';
import Host from './host';
import Setup from './setup';
import { AnotherRole } from './roles';
import StageChannelManager from './channel/stageChannelManager';

type JudgementChoices = 'Abstain' | 'Guilty' | 'Innocent'

interface ConstructorParams {
    guild: Guild,
    server: AnotherServer,
}

interface Judgement {
    judge: Player, 
    choice: JudgementChoices,
    string: string,
    final: boolean
}

interface Vote {
    voter: Player,
    voted: Player
}

export default class Game{

    id: string;

    title = 'Another';
    prefix = '.';

    guild: Guild;
    server: AnotherServer;

    host: Host;
    setup: Setup;
    clock: Clock;
    functions: Functions;

    gameKey: DiscordRole
    rolesToRemove: string[] = [];

    numberOfGhosts = 1;
    players: Player[] = [];
    rolePool: AnotherRole[] = [];

    actions = [];

    votes: Vote[] = [];
    votedUp: Player | null = null;
    judgeString = '';
    judgements: Judgement[] = [];
    freshDeaths: Player[] = [];
    freshReborn: Player[] = [];
    voteWinner = null;
    
    peaceCount = 0;
    maxPeaceCount = 5;
    daysSinceGhostDied = 0;
    ghostChallenge = false;

    stageChannelManager: StageChannelManager;

    constructor({server, guild}: ConstructorParams){
        this.guild = guild;
        this.server = server;
        this.id = `${guild.id}`;
        this.setup = new Setup(this);
        this.clock = new Clock(this);
        this.functions = new Functions(this);
    }  

    setupGame = async () => {
        await this.setup.setupPlayers();
        await this.setup.createGameRole();
        await this.setup.distributeGameRole();
        await this.setup.showPlayerChannels();
        // await this.getSetup().setupGuides();
        await this.host.notifyGameStart();
        this.clock.runTimer();
        this.clock.playLobby();
    }

    gameStart = async () => {
         
        this.getClock().setSecondsRemaining(0);
        this.getClock().freezeTime();
        await this.getSetup().unlockPlayerChannels();

        this.players.map(async player => {
            await this.getFunctions().cleanChannel(player.getChannelManager().getChannel());
            const embed = createEmbed({description: `Game will start in 15...`})
            player.getChannelManager().manageCountDown().create(embed);
        });

        for (let i = 15;i!<0;i--){
            await delay(1500);
            this.players.map(player =>{
                const embed = createEmbed({description: `Game will start in ${i}...`});
                player.getChannelManager().manageCountDown().update(embed);
            });
        }

        this.players.map((p)=> p.getChannelManager().manageCountDown().delete());
        this.getClock().startGame();
    }

    quit = async () => {
        this.getClock().terminateTimer();
        
        this.getPlayers().forEach(async player => {
            player.getConfiscatedValuables().forEach(async valuable => {
                player.getDiscord().roles.add(valuable);
            });
            player.getChannel().delete();
        });

        this.gameKey.delete();

        this.getHost().notifyGameEnd();
        this.server.removeGame(this);
    }
    resetNight = async () => this.players.map(p =>  p.setMuteStatus(false));

    updatePlayerLists = async () => this.players.map(p => p.getChannelManager().managerPlayerList().update());

    async resetDay(){
        const jester: Player = this.players.find(p=>p.getRole().getName()=='Jester' && p.getStatus()=='Dead');
        if(jester){
            jester.getRole().getCommands().filter(c=>c.getName()=='haunt')[0].setStocks(0);
        }
        
        this.players.map(player => player.clearVisitors());

        this.getClock().resetVotingExcessTime();
    }

    listenForWinners = () => {
        const alivePlayers = this.getAlivePlayers()
        alivePlayers.map(( player )=> player.listenForTheWin(alivePlayers))
    }

    listenForDeaths = async () => {
        const currentPeaceCount = this.getClock().getPeaceCount();
        this.getClock().setPeaceCount(currentPeaceCount+1);
        if(this.freshDeaths.length<=0)return
        this.getClock().setPeaceCount(0);
        this.freshDeaths.map((p)=>p.playDeath());
        this.freshDeaths=[];
    }

    listenForResurrections = async () => {
        if(this.freshReborn.length<=0)return;
        this.freshReborn.map(async reborn =>{
            const  msg = `${reborn.getUsername()} has been resurrected!`;
            await this.getFunctions().messagePlayersWrapped(msg);
        });
        this.clearFreshReborn();
    }
  
    pushVote(vote: Vote){
        const { voter, voted } = vote;
        const oldVote = this.votes.find(v => v.voter.getId() === voter.getId());
        if(oldVote){
            const vote ={voter:voter, voted: voted}
            this.votes.push(vote);
        }else{
            if(oldVote.voted.getId() !== voted.getId()){
                const i = this.votes.indexOf(oldVote);
                const vote = { voter:voter, voted:voted }
                this.votes[i] = vote;   
            }else{
                return `**${voter.getUsername()}**, you can't vote the same person twice!`;
            }
        }

        let voteCount=0;
        const ballots = this.votes.filter(v=>v.voted.getId()===voted.getId());
        ballots.forEach(b => voteCount += b.voter.getVoteCount()); // could use reduce function

        const grammar = voteCount > 1 ? 'votes' : 'vote';
        const aliveCount = this.players.filter(p=>p.isAlive()).length;
        const goal = (aliveCount % 2 === 0) ? ( aliveCount / 2 ) + 1 : ( aliveCount + 1 ) / 2;

        const msg = jsonWrap(`${voter.getUsername()} has voted against ${voted.getUsername()}. (${voteCount}/${goal} ${grammar})`)
        this.functions.messagePlayers(msg);
        if(voteCount==goal){
            this.getClock().setNextPhase('Defense');
            this.getClock().setVotingExcessTime(this.getClock().getSecondsRemaining());
            this.getClock().skipPhase();
            this.setVotedUp(voted);
        }
        return `**You** have voted against **${voted.getUsername()}**`;
    }
    
    removeVoteOf = (voter: Player) => {
        const vote = this.votes.find(v => v.voter.getId() === voter.getId());
        if(!vote) return `**You** can't remove a vote if you haven't voted yet.`;

        const index = this.votes.indexOf(vote);
        if (index > -1) { this.votes.splice(index, 1) }
        const voteCount = this.votes.filter(v=>v.voted.getId()===vote.voted.getId()).length;
        const grammar = voteCount > 1 ? 'votes' : 'vote';
        const msg = jsonWrap(`${voter.getUsername()} has cancelled their vote against ${vote.voted.getUsername()}. (${voteCount} ${grammar})`)
        this.functions.messagePlayers(msg);
        return `**You** have cancelled your vote.`;
    }



    pushFreshDeath(a: Player){
        const index = this.freshDeaths.findIndex(someFreshDead => someFreshDead.id === a.id);
        if (index<0) this.freshDeaths.push(a)
    }


    getId = () => this.id
    getTitle = () => this.title
    getClock = () => this.clock
    getSetup = () => this.setup
    getServer = () => this.server
    getPrefix = () => this.prefix
    getFunctions  = () => this.functions

    getHost = () => this.host
    setHost = (a: Host) => this.host = a;
    
    getGuild = () => this.guild
    setGuild = (a: Guild) => this.guild = a

    getGameKey = () => this.gameKey
    setGameKey = (a: DiscordRole) => this.gameKey = a;

    isAdmin = (a:Player) => a.getId()=='481672943659909120';
    isHost = (a:Player) => this.host.getHostId() === a.getId();

    getVotes = () => this.votes
    getVotedUp = () => this.votedUp
    setVotedUp = (a: Player) => this.votedUp = a;
    clearVotes= () => this.votes = []
    clearVotedUp = () => this.votedUp = null;
    
    getPlayers = () => this.players
    connectPlayer = (a: Player) => this.players.push(a)
    getDeadPlayers = () => this.players.filter(( p ) => p.getStatus() === 'Dead');
    getAlivePlayers = () => this.players.filter(( p ) => p.getStatus() === 'Alive');
    
    getFreshDeaths = () => this.freshDeaths
    pushFreshDeaths = (a: Player) => this.freshDeaths.push(a);
    clearFreshDeaths = () => this.freshDeaths = []
    
    getFreshReborn = () => this.freshReborn;
    pushFreshReborn = (a:Player) => this.freshReborn.push(a)
    clearFreshReborn = () => this.freshReborn = []

    getNumberOfGhosts = () => this.numberOfGhosts

    getActions = () => this.actions
    pushAction(action: any){
        const index = this.actions.findIndex(oldAction => oldAction.user === action.user);
        if(index<0)this.actions.push(action)
    }
    removeActionOf = (player: Player) => {
        const index = this.actions.findIndex(a => a.user.getId() == player.getId());
        if(index==0)  return `There are no actions to be cancelled.`;
        this.actions.splice(index,1);
        return `You cancelled your action.`;
    }
    clearActions= () => this.actions = []

    getPeaceCount = () => this.peaceCount
    getRemainingPeaceCount = () => this.maxPeaceCount - this.peaceCount;
    resetPeaceCount = () => this.peaceCount = 0
    incrementPeaceCount = () => this.peaceCount ++

    getGhostChallenge = () => this.ghostChallenge
    setGhostChallenge = (a) => this.ghostChallenge = a;

    getDaysSinceGhostDied = () => this.daysSinceGhostDied
    clearDaysSinceGhostDied = () => this.daysSinceGhostDied = 0
    incrementDaysSinceGhostDied = () => this.daysSinceGhostDied ++;

    getStageChannelManager = () => this.stageChannelManager;
    setStageChannelManager = (a: StageChannelManager) => this.stageChannelManager = a;
}
