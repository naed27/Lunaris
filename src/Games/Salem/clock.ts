import { MessageEmbed } from 'discord.js';
import { createEmbed, createMarkDown, delay } from '../../Helpers/toolbox';
import Game from './game'
import Phases, { Phase, PhasePossibilities } from './phases'

class Clock{

    //cores
    game:Game;

    //phasing
    phases = [...Phases];
    phase: Phase = this.phases[0];
    previousPhase: Phase;
    nextPhase: Phase;
    round: number;
    
    //durations
    lobbyDuration = 90;
    reportingDuration = 0;
    discussionDuration = 35;
    votingDuration = 15;
    defenseDuration = 15;
    judgmentDuration = 10;
    finalWordsDuration = 10;
    executionDuration = 0;
    nightDuration = 20;
    calcDuration = 0;

    // excess time
    votingExcessTime=0;

    peaceCount=0;
    maxPeaceCount=5;

    //timers
    moveTime=false;
    timer:NodeJS.Timer;
    secondsRemaining=0;
    hourChange=false;
    remindTime = false;

    //clocker
    clockers=[];
    
    constructor(game:Game){
        this.game = game;
    }

    // ------------------------------------- FUNCTIONS

    async remindPlayers(){
        if(this.secondsRemaining>5||this.secondsRemaining<1){
            this.game.getPlayers().map((player)=>{
                if(!player.getHouse().getTimer())return
                player.getHouse().getTimer().delete();
                player.getHouse().setTimer(null);
            })
        }else{
            this.game.getPlayers().map(async (player)=>{
                const msg = `‎‎\n${this.phase} will end in ${this.secondsRemaining}...`;
                if(player.getHouse().getTimer()){
                    player.getHouse().getTimer().edit(msg).catch(()=>{});
                }else{
                    player.getHouse().setTimer(await player.getHouse().getChannel().send(msg).catch(()=>{}));
                }
            });
        }
    }

    async runTimer(){
        this.timer = setInterval(async () => {
            this.updateTownClock();
            if(!this.moveTime) return
            if(this.remindTime) this.remindPlayers();
            if(this.secondsRemaining>0) return this.secondsRemaining--;
            
            this.freezeTime();
            this.processPhase();
        }, 1500);
    }


    async processPhase(){
        const phase = this.updatePhase();

        switch(phase){
            case 'Reporting': await this.playReporting(); break

            case 'Discussion': await this.playDiscussion(); break

            case 'Voting': await this.playVoting(); break

            case 'Voting Calculation': await this.playVoting(); break

            case 'Defense': await this.playDefense(); break

            case 'Judgement': await this.playJudgement(); break
            
            case 'Judgement Calculation': await this.playJudgement(); break

            case 'Final Words': await this.playFinalWords(); break

            case 'Execution': await this.playExecution(); break

            case 'Execution Calculation': await this.playExecution(); break

            case 'Night': await this.playNight(); break

            case 'Night Calculation': await this.playNightCalculation(); break

            case 'Game Over': await this.playGameOver(); break
        }
        this.unfreezeTime();
    }

    updatePhase = () => {
        this.previousPhase = this.phase;
    
        this.phase = this.nextPhase;
        this.remindTime = this.phase.remindTime;
        this.increaseTime(this.phase.duration);
    
        if ( this.phase.shouldLockChannel )
          this.game.getStageChannelManager().lock();
        else 
          this.game.getStageChannelManager().unlock();
    
        const next = this.phase.next;
        this.nextPhase = this.phases.find(p => p.name === next.normal);
        
        return this.phase.name;
      }

    playLobby = async () => {
        this.increaseTime(this.lobbyDuration);
        this.unfreezeTime();  
    }

    async playReporting(){
        this.round++;
        this.game.getSetup().closeHouseChannels();
        const message = createMarkDown(`Day ${this.round}.`);
        await this.game.getFunctions().messagePlayers(message);
        await this.game.deathListener();
        await this.game.rebornListener();
        this.increaseTime(this.reportingDuration);
        this.unfreezeTime();  
    }

    async playDiscussion(){
        this.game.getSetup().openHouseChannels();
        if(this.round>1){
            this.increaseTime(this.discussionDuration);
            const message1 = createMarkDown(`Day ${this.round}: The Discussion.\nDuration: ${this.secondsRemaining}s`);
            await this.game.getFunctions().messagePlayers(message1);
    
            if(this.maxPeaceCount-this.peaceCount==1){
                await delay(1000);
                const message2 = createMarkDown(`The game will end in a draw if no one dies tomorrow.`);
                await this.game.getFunctions().messagePlayers(message2);
            }
            await this.game.updatePlayerLists();
        }else{
            const specialPhase = this.phases.find((p)=>p.name==='Night');
            this.nextPhase = specialPhase
            this.increaseTime(15);
            const message2 = createMarkDown(`Day ${this.round}: The Discussion.\nDuration: ${this.secondsRemaining}s`);
            await this.game.getFunctions().messagePlayers(message2);
        }
        this.unfreezeTime();  
    }

    async playVoting(){
        const message = createMarkDown(`Day ${this.round}: The ${this.phase}.\nDuration: ${this.secondsRemaining}s\Type ".vote <player>" to vote someone!`);
        await this.game.getFunctions().messagePlayers(message);
        this.unfreezeTime();
    }

    async playDefense(){
        this.increaseTime(this.defenseDuration);
        this.game.getSetup().closeHouseChannels();

        const message1 = createMarkDown(`The town seems to want to execute ${this.game.getVotedUp().getUsername()}.`);
        await this.game.getFunctions().messagePlayers(message1);
        await delay(3000);

        const message2 = createMarkDown(`${this.game.getVotedUp().getUsername()} was dragged up into the center platform.`);
        await this.game.getFunctions().messagePlayers(message2);
        await delay(4000);

        const message3 = createMarkDown(`${this.game.getVotedUp().getUsername()}, what's your defense?`);
        await this.game.getFunctions().messagePlayers(message3);
        await delay(2000);

        const message4 = `Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.secondsRemaining}s`;
        await this.game.getFunctions().messagePlayers(message4);
        this.game.getVotedUp().getHouse().open();

        this.unfreezeTime(); 
    }

    async playJudgement(){
        const message = `Day ${this.round}: The ${this.phase}.\nDuration: ${this.secondsRemaining}s`;
        await this.game.getFunctions().messagePlayers(message);
        this.game.getSetup().setupJudgementCollector();
        this.unfreezeTime(); 
    }

    async playFinalWords(){
        const message = createMarkDown(`Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.secondsRemaining}s`);
        await this.game.getFunctions().messagePlayers(message);
        this.unfreezeTime(); 
    }

    playExecution = async () => {
        const message1 = createMarkDown(`Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.`);
        await this.game.getFunctions().messagePlayers(message1);
        await delay(3000);

        const message2 = createMarkDown(`After placing the rope around the neck, they took away the wooden footrest...`);
        await this.game.getFunctions().messagePlayers(message2);
        await delay(5000);

        const message3 = createMarkDown(`...And with it, followed ${this.game.getVotedUp().getUsername()}'s final breath.`);
        await this.game.getFunctions().messagePlayers(message3);

        this.game.getVotedUp().kill();
        this.game.clearFreshDeaths();
        await delay(2000);

        if(this.game.getVotedUp().getRole().getName()=="Jester"){
            const message3 = createMarkDown(`${this.game.getVotedUp().getUsername()} will get his revenge!`);
            await this.game.getFunctions().messagePlayers(message3);
            this.game.getVotedUp().setWinStatus(true);
            this.game.getVotedUp().getRole().getCommands().filter(c=>c.getName()=="haunt")[0].setStocks(1);
        }
        
        await this.game.getVotedUp().playDeath();
        await this.game.updatePlayerLists();
        this.game.listenForWinners();
        this.unfreezeTime();
    }

    playNight = async () =>{
        
        this.game.clearVotes();
        await this.game.getSetup().closeHouseChannels();
        this.game.resetNight();

        this.game.updateWerewolf();
        const message = createMarkDown(`Night ${this.round}.\nDuration: ${this.secondsRemaining}s`);
        await this.game.getFunctions().messagePlayers(message);
        await this.game.getFunctions().promoteMafia();

        this.game.processActions();
        await this.game.getSetup().openHouseChannels();

        this.unfreezeTime(); 
    }

    playNightCalculation = async () => {
        this.game.processActions();
    }

    playReportingCalculation = async () => {
        this.game.listenForWinners();
        this.game.resetDay();
        if(this.peaceCount!==this.maxPeaceCount)return
        const nextPhase = this.phases.find((p)=>p.name==='Game Over');
        this.nextPhase = nextPhase;
        this.skipPhase();
    }

    playJudgementCalculation = async () => {
        const isGuilty = await this.game.getSetup().finalJudgements();
        if(isGuilty){
            const nextPhase = this.findPhase('Final Words');
            this.nextPhase = nextPhase;
            await delay(2000);
            const message1 = createMarkDown(`The votes has declared ${this.game.getVotedUp().getUsername()} guilty!`);
            await this.game.getFunctions().messagePlayers(message1);
            await delay(3000);

            const message2 = createMarkDown(`${this.game.getVotedUp().getUsername()}, do you have any last words?`);
            await this.game.getFunctions().messagePlayers(message2);
            await delay(2000);
        }else{
            const nextPhase = this.findPhase('Voting')
            this.nextPhase = nextPhase;
            await delay(2000);
            const message1 = createMarkDown(`The votes has declared ${this.game.getVotedUp().getUsername()} innocent!`);
            await this.game.getFunctions().messagePlayers(message1);
            await delay(2000);
            this.game.clearVotes();

            const message2 = createMarkDown(`${this.game.getVotedUp().getUsername()} walks down the executional platform.`);
            await this.game.getFunctions().messagePlayers(message2);
            await delay(2000);
        }
    }


    async playGameOver(){
        
        const winners = this.game.getPlayers().filter(p=>p.getWinStatus()==true);
        this.game.getHost().notifyGameEnd();

        const message = createMarkDown(`Game Over`);
        await this.game.getFunctions().messagePlayers(message);

        const message2 = createMarkDown(this.game.getFunctions().stringifyWinners(winners));
        await this.game.getFunctions().farewellMessage(message2);

        this.game.getPlayers().map( async (player)=>{
            player.getChannelManager().unlock();
            const address = await player.getChannelManager().getChannel().send(`‎Game will shutdown in 10...`).catch(error=>{})
            player.getChannelManager().manageTimer().set(address);
        
        })
        
        for(let i = 10;i!=0;i--){
            await delay(1500);
            this.game.getPlayers().map((player)=>{
                if(player.getChannelManager().manageTimer().get()){
                    player.getChannelManager().manageTimer().edit(`‎Game will shutdown in ${i}...`).catch(error=>{});
                }
            });
        }
        this.game.quit();
    }

    async startGame(){
        this.round=1;
        this.game.getSetup().openNotepadChannels();
        this.game.getSetup().openHouseChannels();
        this.processPhase();
    }

    async setupTownClock(){
        let title = `Town Clock`;
        let body = ``;
        let footer = ``;
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle(`${title}`)
        .setDescription(`${body}`)
        .setFooter(`${footer}`);

        let clockChannels = this.game.getClockChannels();

        for (const ch of clockChannels) {
            let temp = await ch.getChannel().send(embed).catch(error=>{});
            this.clockers.push(temp)
        }
      
    }

    async updateTownClock(){
        const half= this.phase.name=='Night' ? 'Night' : 'Day';

        const title = `Town Clock`;
        const description=this.phase.name==='Lobby'?
            `Game will auto-start in ${this.secondsRemaining}s`:
            `${half} ${this.round}\nCurrent Phase: ${this.phase}\nTime Left: ${this.secondsRemaining}`

        const embed = createEmbed({ title, description })
        this.clockers.map(clock => clock.edit(embed).catch(()=>{}));
    }

    increaseTime(seconds:number){
        this.hourChange=true;
        this.secondsRemaining+=seconds;
        if(this.secondsRemaining<0){
            this.secondsRemaining=0;
        }
    }

    gameOver = () => {
        const phase = this.findPhase('Game Over');
        this.setNextPhase(phase);
        this.skipPhase();
    }

    findPhase = (phase:PhasePossibilities) => this.phases.find((p)=>p.name===phase);

    freezeTime = () => this.moveTime = false;
    unfreezeTime = () => this.moveTime = true;
    skipPhase = () => this.secondsRemaining = 0;
    terminateTimer = () => clearInterval(this.timer)

    getSecondsRemaining = () => this.secondsRemaining 
    setSecondsRemaining = (a:number) => this.secondsRemaining = a
 
    // -------------------- Setters and Getters

    getPhase = () => this.phase
    getRound = () => this.round

    getNextPhase = () => this.nextPhase
    setNextPhase = (a:Phase) => this.nextPhase = a;

    getPeaceCount = () => this.peaceCount
    setPeaceCount  = (a:number) => this.peaceCount= a

    getRemindTime = () => this.remindTime
    setRemindTime = (a:boolean) => this.remindTime = a
    
    getPreviousPhase = () => this.previousPhase
    setPreviousPhase  = (a:Phase) => this.previousPhase= a
    
    getVotingExcessTime = () => this.votingExcessTime
    setVotingExcessTime = (a:number) => this.votingExcessTime = a
    resetVotingExcessTime = () => this.votingExcessTime = 0


}

export default Clock;