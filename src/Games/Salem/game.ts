import roledump from './roledump';
import Action from './action';
import Setup from './setup';
import Functions from './functions';
import Clock from './clock';
import Host from './host';
import { Guild, Role as DiscordRole } from 'discord.js';
import SalemServer from '../../Servers/SalemServer';
import Player from './player';
import { SalemRole } from './roles';
import { createEmbed, delay, jsonWrap } from '../../Helpers/toolbox';
import StageChannelManager from './channel/stageChannelManager';
import Notif from './notif';

type JudgementChoices = 'Abstain' | 'Guilty' | 'Innocent'

interface ConstructorParams {
    guild: Guild,
    server: SalemServer,
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

    title: 'Town of Salem';
    prefix = '.';
    
    guild: Guild;
    server: SalemServer;
    
    host: Host;
    clock: Clock;
    setup: Setup;
    functions: Functions;
    
    gameKey: DiscordRole;
    rolesToRemove: string[] = [];

    players: Player[] = [];
    rolePool: SalemRole[] = [];

    actions: Action[] = [];

    votes: Vote[] = [];
    votedUp: Player | null = null;
    judgeString = '';
    judgements: Judgement[] = [];
    freshDeaths: Player[] = [];
    freshReborn: Player[] = [];
    jailedPlayer: Player | null = null;

    stageChannelManager: StageChannelManager;

    constructor({server,guild}: ConstructorParams){
        this.guild = guild;
        this.server = server;
        this.id = `${guild.id}`;
        roledump.map((r)=>r.Roles.map((id)=>this.rolesToRemove.push(id)));
        this.setup = new Setup(this);
        this.clock = new Clock(this);
        this.functions = new Functions(this);
    }  

    // ---------------------- Functions

    setupGame = async () => {
        await this.getSetup().setupPlayers();
        await this.getSetup().createGameRole();
        this.getSetup().distributeGameRole();
        await this.getSetup().setupPlayerCollectors();
        await this.getSetup().unlockPlayerChannels();
        await this.getSetup().setupExeTarget();
        await this.getHost().notifyGameStart();
        this.getClock().runTimer();
        await this.getClock().playLobby();
    }

    async updateWerewolf(){
        const round = this.clock.getRound();
        const werewolves = this.getPlayersWithRole('Werewolf');
        const report = round%2==0 ? 
            'Your target is suspicious! ': 
            'Your target seems innocent.';
        werewolves.forEach(werewolf => werewolf.getMaskRole().getResults().setSheriff(report) );
    }

    resetNight = async () => this.players.map(p =>  p.setMuteStatus(false));

    updatePlayerLists = async () => this.players.map(p => p.getChannelManager().managerPlayerList().update());

    async resetDay(){
        const jester: Player = this.players.find(p=>p.getRole().getName()=='Jester' && p.getStatus()=='Dead');
        if(jester){
            jester.getRole().getCommands().filter(c=>c.getName()=='haunt')[0].setStocks(0);
        }
        
        this.players.map(player => {
            player.resetMask();
            player.clearBuffs();
            player.clearVisitors();
            player.clearJudgement();
            player.setSeanceStatus(false);
            player.setRoleBlockStatus(false);
        });

        if(this.getJailedPerson())
            this.getJailedPerson().setJailStatus(false);
        
        this.getClock().resetVotingExcessTime();
    }


    deathListener = async () => {
        const currentPeaceCount = this.getClock().getPeaceCount();
        this.getClock().setPeaceCount(currentPeaceCount+1);
        if(this.freshDeaths.length<=0)return
        this.getClock().setPeaceCount(0);
        this.freshDeaths.map((p)=>p.playDeath());
        this.freshDeaths=[];
    }

    rebornListener = async () => {
        if(this.freshReborn.length<=0)return;
        this.freshReborn.map(async reborn =>{
            const  msg = `${reborn.getUsername()} has been resurrected!`;
            await this.getFunctions().messagePlayersWrapped(msg);
        });
        this.clearFreshReborn();
    }

    pushAction( action: Action ){
        const index = this.actions.findIndex(a => a.user.getId() == action.getUser().getId());
        (index>=0) ? this.actions[index]=action : this.actions.push(action)
    }

    removeActionOf = (player: Player) => {
        const index = this.actions.findIndex(a => a.user.getId() == player.getId());
        if(index==0)  return `There are no actions to be cancelled.`;
        this.actions.splice(index,1);
        return `You cancelled your action.`;
    }

    arrangeActions = () =>{
        return this.actions.sort((a,b)=>{
            const aPriority = a.getCommand().getPriority();
            const bPriority = b.getCommand().getPriority();
            if(aPriority<bPriority)return -1;
            if(aPriority>bPriority)return 1;
            return 0;
        });
    }

    listenForWinners = () => {
        const alivePlayers = this.getAlivePlayers()
        alivePlayers.map(( player )=> player.listenForTheWin(alivePlayers))
    }

    processActions(){
        
        this.actions = this.arrangeActions();
        this.actions.map(a => {

            const gameAndUserObject = { game: this, user: a.getPerformer() }

            if(!a.getFirstTarget().isJailed() || a.getUser().roleNameIs('Jailor')){
                if(a.getFirstTarget().getBuffs().find( b => b === 'Alert' )){
                    
                    if(!a.getPerformer().isRoleBlocked() /* witch flag ??? */ ){
                        a.getCommand().run({
                            game: this,
                            user: a.getPerformer(),
                            args: a.getArgs(),
                            command: a.getCommand(),
                            targetOne: a.getFirstTarget(),
                            targetTwo: a.getSecondTarget(),
                        });

                        if(a.getCommand().visitsTarget(gameAndUserObject)){
                            a.getTargets().forEach( t => t.pushVisitor(a.getPerformer()) );
                        }
                    }

                }else{
                    if(a.getCommand().visitsTarget(gameAndUserObject)){
                        const visitedNotif = new Notif({ inbox: `You shot the person who visited you last night!` })
                        const visitorNotif = new Notif({ inbox: `You were shot by the Veteran that you visited!` })
                        a.getFirstTarget().pushNotif(visitedNotif);
                        a.getPerformer().pushNotif(visitorNotif);
                        a.getPerformer().kill();
                        a.getPerformer().pushCauseOfDeath(`shot by a Veteran.`);
                    }
                }
            }else{
                const notice = a.getPerformer().roleNameIs('Transporter') ?
                    'One of your targets was in jail!\nThe transportation has failed!' :
                    'Your target was in jail!'
                a.getPerformer().pushNotif(new Notif({inbox: notice}));
            }
            a.setStatus('Done');
        });

        this.clearActions();
            
        if(this.freshDeaths.length>0){
            this.freshDeaths.map( p => p.pushNotif(new Notif({inbox: `You have died.`})));
        }
        
        this.players.map(p => {
            if(p.getNotifs().length===0)return
            const string = p.getNotifs().map((n)=>n.inbox).join('\n')
            p.sendMarkDownToChannel(string);
            p.clearNotifs();
        });
    }

    getVisitorsOf = (a: Player) => a.getVisitors();

    // ----------- Game Starter

    gameStart = async () => {
    
        this.getClock().setSecondsRemaining(0);
        this.getClock().freezeTime();
        await this.getSetup().unlockPlayerChannels();

        this.players.map(async player => {
            await this.getSetup().cleanChannel(player.getChannelManager().getChannel());
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
    
    // ------------------------------------- SETTERS / GETTERS

    getJudgements = () => this.judgements;
    pushJudgement( rawJudgement : {judge: Player,choice: JudgementChoices} ){
        const { judge, choice } = rawJudgement;
        const previousJudgement = this.judgements.find(j => j.judge.getId() === judge.getId());
        if(previousJudgement){
            const i = this.judgements.indexOf(previousJudgement);
            const string = (choice === 'Abstain') ? 
                `**${judge.getUsername()}** has cancelled their vote.` : 
                `**${judge.getUsername()}** has changed their vote.`
            this.judgements[i].final = false; 
            const judgement = {...rawJudgement,string,final: true};
            this.judgements.push(judgement);
        }else{
            const string =`**${judge.getUsername()}** has voted.`
            const judgement = {...rawJudgement,string, final: true};
            this.judgements.push(judgement);
        }
        this.updatePlayerJudgements();
    }
    
    updatePlayerJudgements = () => this.players.map(p => p.getChannelManager().manageJudgement().update());
    
    getVotes = () => this.votes;
    clearVotes = () => this.votes = [];
    
    pushVote = (vote: Vote) => {
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
    

    getHost = () => this.host;
    setHost = (a:Host) => this.host = a;
    
    getPrefix = () => this.prefix;
    setPrefix = (a: string) => this.prefix = a;

    getSetup = () => this.setup;
    setSetup = (a: Setup) => this.setup = a;

    getFunctions = () => this.functions;
    setFunctions = (a: Functions) => this.functions = a;
    
    setRolePool = (a: SalemRole[]) => this.rolePool = a;
    getRolePool = () => this.rolePool;

    getFreshDeaths = () => this.freshDeaths
    clearFreshDeaths = () => this.freshDeaths=[];

    getFreshReborn = () => this.freshReborn;
    pushFreshReborn = (a:Player) => this.freshReborn.push(a)
    clearFreshReborn = () => this.freshReborn = []
    
    roleExists = (a:string) => this.players.filter((p)=>p.getRoleName()===a).length>0;

    getPlayers = () => this.players;
    connectPlayer = (a: Player) => this.players.push(a);

    getMafias = () => this.players.filter(p => p.getRole().getAlignment()==='Mafia');
    getAliveMafias = () => this.players.filter(p => p.getRole().getAlignment()==='Mafia' && p.isAlive());

    getNonMafias = () => this.players.filter(p => p.getRole().getAlignment()!=='Mafia');

    getDeadPlayers = () => this.players.filter(( p ) => p.getStatus() === 'Dead');
    getAlivePlayers = () => this.players.filter(( p ) => p.getStatus() === 'Alive');

    getTitle = () => this.title;

    pushFreshDeath = (user: Player) => {
        const index = this.freshDeaths.findIndex(a => a.getId() === user.getId());
        if(index==0) this.freshDeaths.push(user);
    }

    getVotedUp = () => this.votedUp
    setVotedUp = (a: Player) => this.votedUp = a
    clearVotedUp = () => this.votedUp = null;

    getSeanced = () => this.players.find(( p ) => p.getSeanceStatus());
    getMediums = () => this.players.filter((p)=>p.getRole().getName() === 'Medium' && p.isAlive());
 
    getRolesToRemove = () => this.rolesToRemove;
    pushRoleToRemove = (a: string) => this.rolesToRemove.push(a) 
    setRoleToRemove = (a: string) => this.rolesToRemove = [ a ];
    clearRolesToRemove = () => this.rolesToRemove = [];

    getActions = () => this.actions;
    clearActions = () => this.actions = [];

    getActionOf = (player:Player) => this.actions.find((a)=>a.getPerformer().getId() === player.getId());
    
    getStageChannelManager = () => this.stageChannelManager;
    setStageChannelManager = (a: StageChannelManager) => this.stageChannelManager = a;

    getId = () => this.id;

    getJailor = () => this.players.filter( p => p.getRole().getName() === 'Jailor')[0];
    
    getJailedPerson = () => {
        const jailedPerson = this.players.find(p=>p.isJailed()) 
        return jailedPerson ? jailedPerson : null;
    }

    getServer = () => this.server
    getGameKey = () =>  this.gameKey;
    setGameKey = ( key: DiscordRole ) => this.gameKey = key;

    getGuild = () => this.guild
    setGuild = ( guild: Guild ) => this.guild = guild

    getClock = () => this.clock;
    setClock = (a: Clock) => this.clock = a;

    getPlayersWithStatus = (status:string) => this.players.filter(p=>p.getStatus()===status);
    getPlayersWithRole = (role:string) => this.players.filter(p=>p.getRole().getName()==role);
    
    isAdmin = (a:Player) => a.getId() === '481672943659909120';
    isHost = (a:Player) => this.host.getHostId() === a.getId();


    // ------------------------------------- QUITTERS

    quit = async () => {
        this.getClock().terminateTimer();
        this.players.map( async player => {
            player.getExRoles().map( role => player.getDiscord().roles.add(role));
            player.getChannel().delete();
        });
        this.gameKey.delete()
        await this.getHost().notifyGameEnd();
        this.server.removeGame(this);
    }
  
}
