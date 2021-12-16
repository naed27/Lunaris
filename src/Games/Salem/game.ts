import util from "./utility";
import roledump from "./roledump";
import Action from "./action";
import Setup from "./setup";
import Functions from "./functions";
import Clock from "./clock";
import Host from "./host";
import { Guild, Role } from "discord.js";
import SalemServer from "../../Servers/SalemServer";
import Player from "./player";
import { SalemRoleCommand } from "./roles";
import Ability from "./command/ability";
import GlobalAbility from "./command/global";

interface ConstructorParams {
    guild: Guild;
    server: SalemServer;
}

export default class Game{

    id:string;

    title: 'Town of Salem';
    
    guild: Guild;
    server: SalemServer;
    
    host:Host;
    clock: Clock;
    gameKey: Role;

    setup;
    functions;
    priority=[];
    
    rolesToRemove=[];

    prefix = ".";
    actions: Action[]=[];
    players: Player[]=[];
    jail=[];
    votes=[];
    votedUp=null;
    judgements = [];
    judgeString="";
    freshDeaths=[];
    freshReborn = [];

    channels=[];

    constructor({server,guild}: ConstructorParams){
        this.guild = guild;
        this.server = server;
        this.id = `${guild.id}`;
        this.rolesToRemove = roledump.list;

        this.setup = new Setup(this);
        this.clock = new Clock(this);
        this.functions = new Functions(this);
    }  

    // ---------------------- Functions

    async setupGame(){
        await this.getSetup().setupPlayers();
        await this.getSetup().creategameKey();
        await this.getSetup().passRoles();
        await this.getSetup().setupClockChannel();
        await this.getClock().setupTownClock();
        await this.getSetup().setupPlayerCollectors();
        await this.getSetup().showStartingChannels();
        await this.getSetup().setupGuides();
        await this.getSetup().setupExeTarget();
        await this.getHost().notifyGameStart();
        await this.getClock().runTimer();
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

    resetNight = async () => this.getPlayers().map(p =>  p.setMuteStatus(false));

    updatePlayerLists = async () => this.getPlayers().map(p => p.getHouse().updatePlayerList());

    async resetDay(){
        const jester: Player = this.getPlayers().find(p=>p.getRole().getName()=="Jester" && p.getStatus()=="Dead");
        if(jester){
            jester.getRole().getCommands().filter(c=>c.getName()=="haunt")[0].setStocks(0);
        }
        
        this.getPlayers().map(player => {
            player.resetMask();
            player.clearBuffs();
            player.clearVisitors();
            player.clearJudgement();
            player.setSeanceStatus(false);
            player.setRoleBlockStatus(false);
        });

        if(this.getJailedPerson()){
            this.getJailedPerson().setJailStatus(false);
        }
        
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
        (index>=0)? this.actions[index]=action : this.actions.push(action)
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
            const firstTargetIsJailed = a.getFirstTarget().getJailStatus();
            const secondTargetIsJailed = a.getSecondTarget().getJailStatus();
            const firstTargetIsAlertedVeteran = a.getFirstTarget().getAlertStatus();

            if(!a.getFirstTarget().getJailStatus() || a.getUser().getRole().getName()=="Jailor"){
                if(a.getFirstTarget().getBuffs().filter(b=>b=="Alert").length==0){

                    if(!a.getPerformer().getRoleBlockStatus() && a.getCommand()!=-1 && this.functions.witchFlag(a)){
                        a.getCommand().Act(a.getUser(),a.getPerformer(),a.getCommand(),a.getTargets(),this);
                    }
                    if(a.getCommand().VisitsTarget(a.getUser(),this)){
                        a.getTargets().forEach(t => {
                            t.pushVisitor(a.getPerformer());
                        });
                    }

                }else{
                    if(a.getCommand().VisitsTarget(a.getUser(),this)){
                        let notif1 = {player:`You shot the person who visited you last night!`,spy:null}
                        let notif2 = {player:`You were shot by the Veteran that you visited!`,spy:null}
                        a.getFirstTarget().pushNotif(notif1);
                        a.getPerformer().pushNotif(notif2);
                        a.getPerformer().kill();
                        a.getPerformer().pushCauseOfDeath(`shot by a Veteran.`);
                    }
                }
            }else{
                let inJailNotice = {
                    player: "Your target was in jail!",
                    spy: null
                }
                if(a.getPerformer().getRole().getName()=="Transporter"){
                    inJailNotice = {
                        player: "One of your targets was in jail!\nThe transportation has failed!",
                        spy: null
                    }
                }
                a.getPerformer().pushNotif(inJailNotice);
            }
            a.setStatus("Done");
        });
        this.clearActions();
            
        
        if(this.freshDeaths.length>0){
            let notif = {
                player: `You have died.`,
                spy: null
            }
            this.freshDeaths.forEach(p => {
                p.pushNotif(notif)
            });
        }
        
        this.players.forEach(p => {
            if(p.getNotifs().length>0){
                let notifs = p.getNotifs();
                let string = "";
                for (let i = 0; i < notifs.length; i++) {
                    string += `${notifs[i].player}`;
                    if(i<notifs.length-1){
                        string+=`\n`;
                    }
                }
                util.gameMessage(string,p.getHouse().getChannel());
                p.clearNotifs();
            }
        });
    }

    setPriority(){
        let array = this.players;
        for(let i=1;i<array.length;i++){
            let target = array[i].role.Priority;
            for(let j=i-1;j>=0;j--){
                let past = array[j].role.Priority;
                if(target[0]<past[0]){
                    let temp = array[j];
                    array[j] = array[i];
                    array[i] = temp;
                    i--;
                }else if(target[0]==past[0]&&target[1]<past[1]){
                    let temp = array[j];
                    array[j] = array[i];
                    array[i] = temp;
                    i--;
                }
            }
        }
        this.priority = array;
    }


    // ------------------------------------- GAME STARTER

    async gameStart(){
        
        this.getClock().setSecondsRemaining(0);
        this.getClock().freezeTime();
        await this.getSetup().closeHouseChannels();
        await this.getSetup().closeNotepadChannels();

        this.getPlayers().forEach(async player => {
            await this.getSetup().cleanChannel(player.getHouse().getChannel());
            player.getHouse().setTimer(await player.getHouse().getChannel().send(`‎Game will start in 15...`).catch());
            player.getNotepad().setTimer(await player.getNotepad().getChannel().send(`‎Game will start in 15...`).catch());
        });

        for (let i = 15;i!=0;i--){
            await util.delay(1500);
            this.getPlayers().forEach(player =>{
                if(player.getHouse().getTimer()){
                    player.getHouse().getTimer().edit(`‎Game will start in ${i}...`).catch();
                }
                if(player.getNotepad().getTimer()){
                    player.getNotepad().getTimer().edit(`Game will start in ${i}...`).catch();
                }   
            });
        }
        await util.delay(1500);

        for await(const player of this.getPlayers()) {
            if(player.getHouse().getTimer()){
                player.getHouse().getTimer().delete();
                player.getHouse().setTimer(null);
            }
            if(player.getNotepad().getTimer()){
                player.getNotepad().getTimer().delete();
                player.getNotepad().setTimer(null);
            }
        }
        
        
        await this.getClock().startGame();
    }
    


    // ------------------------------------- SETTERS / GETTERS

    getJudgements(){return this.judgements;}
    pushJudgement(judge,choice){
        let judgement ={
            judge:judge,
            choice: choice
        }
        let check = this.judgements.filter(j => j.judge.getId() === judge.getId());
        if(check.length===0){
            this.judgements.push(judgement);
            if(this.judgeString.length>0){
                this.judgeString+=`\n**${judge.getUsername()}** has voted.`
            }else{
                this.judgeString+=`**${judge.getUsername()}** has voted.`
            }
        }else{
            let i = this.votes.indexOf(check[0]);
            this.judgements[i]=judgement; 
            if(choice=="Abstain"){
                this.judgeString+=`\n**${judge.getUsername()}** has cancelled their vote.`
            }else{
                this.judgeString+=`\n**${judge.getUsername()}** has changed their vote.`
            }
        }
        this.players.forEach(p => {
            p.getHouse().editJudgeCard(this.judgeString);
        });
    }

    getVotes(){return this.votes;}
    clearVotes(){this.votes=[];}
    pushVote(voter,voted){
        let check = this.votes.filter(v => v.voter.getId() === voter.getId());
        if(check.length===0){
            let vote ={
                voter:voter,
                voted: voted
            }
            this.votes.push(vote);
        }else{
            if(check[0].voted.getId()!=voted.getId()){
                let i = this.votes.indexOf(check[0]);
                let vote ={
                    voter:voter,
                    voted:voted
                }
                this.votes[i]=vote;   
            }else{
                return `**${voter.getUsername()}**, you can't vote the same person twice!`;
            }
        }

        let voteCount=0;
        let ballots=this.votes.filter(v=>v.voted.getId()===voted.getId());
        ballots.forEach(b => {
            voteCount+=b.voter.getVoteCount();
        });

        let grammar;
        if(voteCount==1||voteCount==0){grammar="vote";}else{grammar="votes";}
        let alive_count = this.getPlayers().filter(p=>p.getStatus()=="Alive").length;
        let goal = 0;
        if(alive_count%2==0){
            goal = (alive_count/2)+1;
        }else{
            goal = (alive_count+1)/2;
        }
        let msg = `‎\n\`\`\`json\n${voter.getUsername()} has voted against ${voted.getUsername()}. (${voteCount}/${goal} ${grammar})\`\`\``;
        this.functions.messagePlayers(msg);
        if(voteCount==goal){
            const phase = this.getClock().findPhase('Defense')
            this.getClock().setNextPhase(phase);
            this.getClock().setVotingExcessTime(this.getClock().getSecondsRemaining());
            this.getClock().skipPhase();
            this.setVotedUp(voted);
        }
        return `**You** have voted against **${voted.getUsername()}**`;
    }
    removeVote(voter){
        // let ballot = this.votes.filter(v => v.voter.getId() === voter.getId());
        // if(ballot.length>0){
        //     ballot = ballot[0]
        //     let index = this.votes.indexOf(ballot);
        //     if (index > -1) {
        //         this.votes.splice(index, 1);
        //     }
        //     let voteCount = this.votes.filter(v=>v.voted.getId()===ballot.voted.getId()).length;
        //     let grammar;
        //     if(voteCount==1 || voteCount==0){
        //         grammar = "vote";
        //     }else{
        //         grammar = "votes";
        //     }
        //     let msg = `‎\n\`\`\`json\n${voter.getUsername()} has cancelled their vote against ${ballot.voted.getUsername()}. (${voteCount} ${grammar})\`\`\``;
        //     this.functions.messagePlayers(msg);
        //     return `**You** have cancelled your vote.`;
        // }else{
        //     return `**You** can't remove a vote if you haven't voted yet.`;
        // }
    }
    

    getHost(){return this.host;}
    setHost(a){this.host=a;}

    getChannels(){return this.channels;}
    setChannels(a){this.channels=a;}
    pushChannel(a){this.channels.push(a);}
    
    getPrefix(){return this.prefix;}
    setPrefix(a){this.prefix=a;}

    getSetup(){return this.setup;}
    setSetup(a){this.setup=a;}

    getFunctions(){return this.functions;}
    setFunctions(a){this.functions = a}

    getFreshReborn(){return this.freshReborn;}
    pushFreshReborn(a){this.freshReborn.push(a);}
    clearFreshReborn(){this.freshReborn=[];}

    getClock(){return this.clock;}
    setClock(a){this.clock=a;}

    getPlayers(){return this.players;}
    pushPlayer(a){this.players.push(a);}

    getDeadPlayers = () => this.players.filter((p)=>p.getStatus()==='Dead');
    getAlivePlayers = () => this.players.filter((p)=>p.getStatus()==='Alive');

    getTitle = () => this.title
    
    // getDay(){ return this.day;}
    // setDay(a){this.day=a;}

    pushFreshDeath(user){
        let index = this.freshDeaths.findIndex(a => a.getId() == user.getId());
        if(index==0)
        this.freshDeaths.push(user);
    }

    getFreshDeaths(){return this.freshDeaths;}
    clearFreshDeaths(){this.freshDeaths=[];}

    getVotedUp(){return this.votedUp;}
    setVotedUp(a){this.votedUp=a;}
    clearVotedUp(){this.votedUp=null}

    getRolesToRemove(){return this.rolesToRemove;}
    pushRoleToRemove(a){this.rolesToRemove.push(a);}
    setRoleToRemove(a){this.rolesToRemove=a;}

    getActions(){return this.actions}

    getId(){return this.id;}


    clearActions(){this.actions = [];}
    removeAction(user){
        let index = this.actions.findIndex(a => a.user.getId() == user.getId());
        if(index>=0){
            this.actions.splice(index,1);
            return `You cancelled your action.`;
        }else{
            return `There are no actions to be cancelled.`;
        }
    }


    getClockChannels(){return this.getChannels().filter(c=>c.getName()=="clock");}

    getJailor(){
        return this.players.filter(p=>p.getRole().getName()=="Jailor")[0];
    }
    
    getJailedPerson(){
        let jailed = this.players.filter(p=>p.getJailStatus()==true);
        if(jailed.length>0){
            return jailed[0];
        }else{
            return null
        }
    }


    getServer = () => this.server
    getGameKey = () =>  this.gameKey;
    setGameKey = ( key: Role ) => this.gameKey = key;

    getGuild = () => this.guild
    setGuild = ( guild: Guild ) => this.guild = guild

    getPlayersWithStatus = (status:string) => this.players.filter(p=>p.getStatus()===status);
    getPlayersWithRole = (role:string) => this.players.filter(p=>p.getRole().getName()==role);
    
    isHost = (a:Player) => {
        const hostId = this.host.getHostId();
        const playerId = a.getId();
        return hostId === playerId;
    } 

    isAdmin = (a:Player) => a.getId()=="481672943659909120"


    // ------------------------------------- QUITTERS

    async quit(){
        this.getClock().terminateTimer();

        this.getChannels().map( channel => {
            channel.getChannel().delete();
        });

        this.getPlayers().map( async player => {
            player.getExRoles().map( role => player.getDiscord().roles.add(role));
            player.getChannels().map( channel => channel.getChannel().delete());
        });

        this.gameKey.delete()

        await this.getHost().notifyGameEnd();

        this.server.removeGame(this);
    }
  

}
