import { delay, jsonWrap, createEmbed } from '../../Helpers/toolbox';
import Phases, { Phase, PhasePossibilities } from './phases';
import Game from './game';

export default class Clock{

  //cores
  game: Game;

  //phasing
  phases = [...Phases];
  phase: Phase = this.phases[0];
  nextPhase: Phase;
  previousPhase: Phase;
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

  //misc
  peaceCount = 0;
  maxPeaceCount = 5;
  votingExcessTime = 0;

  //timer
  moveTime = false;
  hourChange = false;
  remindTime = false;
  timer: NodeJS.Timer;
  secondsRemaining = 0;
  
  constructor(game:Game){ this.game = game }

  // ------------------------ Function

  remindPlayers = () => {
    if( this.secondsRemaining > 5 || this.secondsRemaining < 1 )
        return this.game.getPlayers().map((player)=> player.getChannelManager().manageCountDown().create())
    return this.game.getPlayers().map((player)=> player.getChannelManager().manageCountDown().update())
  }

  runTimer(){
    this.timer = setInterval(async () => {
      this.updateClocks();
      if(!this.moveTime) return
      if(this.remindTime) this.remindPlayers();
      if(this.secondsRemaining>0) return this.secondsRemaining--;
      
      this.freezeTime();
      this.processPhase();
    }, 1500);
  }

  updateClocks = () => this.game.getPlayers().map(p => p.getChannelManager().manageClock().update());

  updatePhase = () => {
    this.previousPhase = this.phase;

    this.phase = this.nextPhase;
    this.remindTime = this.phase.remindTime;
    this.increaseTime(this.phase.duration);

    if ( this.phase.shouldLockChannel )
      this.game.getFunctions()
    else 
      this.game.getStageChannelManager().unlock();

    const next = this.phase.next;
    this.nextPhase = this.phases.find(p => p.name === next.normal);
    
    return this.phase.name;
  }

  processPhase = async () => {
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

  playLobby = async () => {
    this.increaseTime(this.lobbyDuration);
    this.unfreezeTime();  
  }

  playReporting = async () => {
    this.round++;
    this.game.getFunctions().lockPlayerChannels();
    const message = jsonWrap(`Day ${this.round}.`);
    await this.game.getFunctions().messagePlayers(message);
    await this.game.listenForDeaths();
    await this.game.listenForResurrections();
    this.increaseTime(this.reportingDuration);
    this.unfreezeTime();  
  }
  playDiscussion = async () =>{
    this.game.getSetup().unlockPlayerChannels();
    if(this.round>1){
        this.increaseTime(this.discussionDuration);
        const message1 = jsonWrap(`Day ${this.round}: The Discussion.\nDuration: ${this.secondsRemaining}s`);
        await this.game.getFunctions().messagePlayers(message1);

        if(this.maxPeaceCount-this.peaceCount==1){
            await delay(1000);
            const message2 = jsonWrap(`The game will end in a draw if no one dies tomorrow.`);
            await this.game.getFunctions().messagePlayers(message2);
        }
        await this.game.updatePlayerLists();
    }else{
        const specialPhase = this.phases.find((p)=>p.name==='Night');
        this.nextPhase = specialPhase
        this.increaseTime(15);
        const message2 = jsonWrap(`Day ${this.round}: The Discussion.\nDuration: ${this.secondsRemaining}s`);
        await this.game.getFunctions().messagePlayers(message2);
    }
    this.unfreezeTime();  
  }

  playVoting  = async () => {
    const message = jsonWrap(`Day ${this.round}: The ${this.phase}.\nDuration: ${this.secondsRemaining}s\Type ".vote <player>" to vote someone!`);
    await this.game.getFunctions().messagePlayers(message);
    this.unfreezeTime();
  }

  playDefense = async () => {
    this.increaseTime(this.defenseDuration);
    this.game.getSetup().lockPlayerChannels();

    const message1 = jsonWrap(`The town seems to want to execute ${this.game.getVotedUp().getUsername()}.`);
    await this.game.getFunctions().messagePlayers(message1);
    await delay(3000);

    const message2 = jsonWrap(`${this.game.getVotedUp().getUsername()} was dragged up into the center platform.`);
    await this.game.getFunctions().messagePlayers(message2);
    await delay(4000);

    const message3 = jsonWrap(`${this.game.getVotedUp().getUsername()}, what's your defense?`);
    await this.game.getFunctions().messagePlayers(message3);
    await delay(2000);

    const message4 = `Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.secondsRemaining}s`;
    await this.game.getFunctions().messagePlayers(message4);
    this.game.getVotedUp().getChannelManager().unlock();

    this.unfreezeTime(); 
  }

  playJudgement = async () => {}

  playFinalWords = async () => {
    const message = jsonWrap(`Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.secondsRemaining}s`);
    await this.game.getFunctions().messagePlayers(message);
    this.unfreezeTime(); 
  }

  playExecution = async () => {
    const message1 = jsonWrap(`Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.`);
    await this.game.getFunctions().messagePlayers(message1);
    await delay(3000);

    const message2 = jsonWrap(`After placing the rope around the neck, they took away the wooden footrest...`);
    await this.game.getFunctions().messagePlayers(message2);
    await delay(5000);

    const message3 = jsonWrap(`...And with it, followed ${this.game.getVotedUp().getUsername()}'s final breath.`);
    await this.game.getFunctions().messagePlayers(message3);

    this.game.getVotedUp().kill();
    this.game.clearFreshDeaths();
    await delay(2000);

    if(this.game.getVotedUp().getRole().getName()=="Jester"){
        const message3 = jsonWrap(`${this.game.getVotedUp().getUsername()} will get his revenge!`);
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
    await this.game.getSetup().lockPlayerChannels();
    this.game.resetNight();

    const message = jsonWrap(`Night ${this.round}.\nDuration: ${this.secondsRemaining}s`);
    await this.game.getFunctions().messagePlayers(message);

    this.game.getFunctions().processActions();
    await this.game.getSetup().unlockPlayerChannels();

    this.unfreezeTime(); 
  }

  playNightCalculation = async () => {
    this.game.getFunctions().processActions();
  }

  playReportingCalculation = async () => {
    this.game.listenForWinners();
    this.game.resetDay();
    if(this.peaceCount!==this.maxPeaceCount)return
    const nextPhase = this.phases.find((p)=>p.name==='Game Over');
    this.nextPhase = nextPhase;
    this.skipPhase();
  }

  playJudgementCalculation = async () => {}

  playGameOver = async () => {

    this.game.getHost().notifyGameEnd();

    const message = jsonWrap(`Game Over`);
    await this.game.getFunctions().messagePlayers(message);

    const message2 = jsonWrap(this.game.getFunctions().stringifyWinners());
    await this.game.getFunctions().gameOverMessage(message2);

    this.game.getPlayers().map( async (player)=>{
        player.getChannelManager().unlock();
        const embed = createEmbed({description:`Game will shutdown in 10...`})
        player.getChannelManager().manageCountDown().create(embed);
    })

    for(let i = 10;i!=0;i--){
        await delay(1500);
        this.game.getPlayers().map((player)=>{
            const embed = createEmbed({description:`Game will shutdown in ${i}...`})
            player.getChannelManager().manageCountDown().update(embed)
        });
    }
    this.game.quit();
  }

  startGame = async () => {
    this.round = 1;
    this.game.getSetup().unlockPlayerChannels();
    this.processPhase();
  }

  endGame = () => {
    this.setNextPhase('Game Over');
    this.skipPhase();
  }

  increaseTime(seconds:number){
    this.hourChange = true;
    this.secondsRemaining += seconds;
    if(this.secondsRemaining<0)
      this.secondsRemaining=0
  }

  freezeTime = () => this.moveTime = false;
  unfreezeTime = () => this.moveTime = true;
  skipPhase = () => this.secondsRemaining = 0;
  terminateTimer = () => clearInterval(this.timer)
  getSecondsRemaining = () => this.secondsRemaining;
  setSecondsRemaining = (a: number) => this.secondsRemaining = a;
  findPhase = (phase:PhasePossibilities) => this.phases.find((p)=>p.name===phase);

  // ------------------------------------- SETTERS / GETTERS

  getPhase = () => this.phase
  getRound = () => this.round
  
  getNextPhase = () => this.nextPhase
  setNextPhase = (a: PhasePossibilities) => this.nextPhase = this.phases.find(p => p.name === a);

  getPeaceCount = () => this.peaceCount
  setPeaceCount  = (a:number) => this.peaceCount= a

  getRemindTime = () => this.remindTime
  setRemindTime = (a:boolean) => this.remindTime = a
  
  getPreviousPhase = () => this.previousPhase
  setPreviousPhase  = (a:Phase) => this.previousPhase = a
  
  getVotingExcessTime = () => this.votingExcessTime
  resetVotingExcessTime = () => this.votingExcessTime = 0
  setVotingExcessTime = (a:number) => this.votingExcessTime = a
}

module.exports = Clock;