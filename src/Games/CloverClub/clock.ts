import { jsonWrap } from "../../Helpers/toolbox";
import Game from "./game";
import gamePhases, { Phase } from "./phases";

export default class Clock{

  //cores
  game: Game;

  //phasing
  phases = [...gamePhases];
  phase: Phase = this.phases[0];
  previousPhase: Phase;
  nextPhase: Phase;
  round = 0;
  turn = 0;
  
  //durations
  lobbyDuration = 3000;
  questioningDuration = 60;
  answeringDuration = 20;
  calcDuration = 0;

  //timers
  moveTime=false;
  timer:NodeJS.Timer;
  secondsLeft = 0;
  remindTime = false;


  constructor (game: Game){
    this.game = game;
  }

  // ------------------------------------- FUNCTIONS

  async updateTimer(){
    this.game.getStageChannelManager().updateTimer({
      currentPhase:this.phase,
      secondsLeft:this.secondsLeft
    })
  }

  runTimer = async () => {
    this.timer = setInterval(() => {
      if(!this.moveTime)return

      this.updateTimer();

      if(this.secondsLeft>0)
        return this.secondsLeft--;

      this.freezeHourGlass();
      this.processPhase();
    }, 1500);
  }

  freezeHourGlass = () => this.moveTime = false
  unfreezeHourGlass = () => this.moveTime = true

  async processPhase(){

    const phase = this.updatePhase();

    switch(phase){
      case "Lobby": return this.playLobby();
        
      case "Question": return this.playQuestioning();

      case "Answer": return this.playAnswer();

      case "Turn Result": return this.playTurnResults();

      case "Calculation": return this.playCalculation();
    }
  }


  playLobby = () => {
    this.game.getStageChannelManager().unlock();
    this.unfreezeHourGlass();
  }


  playQuestioning = async () => {
    this.turn += 1;
    this.round = this.determineRound();
    const message = jsonWrap('question phase');
    await this.game.getStageChannel().send(message);
    this.unfreezeHourGlass();  
  }

  playAnswer = async () => {
    const message = jsonWrap('answer phase');
    await this.game.getStageChannel().send(message);
    this.unfreezeHourGlass();  
  }

  playTurnResults = async () => {
    const message = jsonWrap('turn results phase');
    await this.game.getStageChannel().send(message);
    this.unfreezeHourGlass(); 
  }

  playCalculation = () =>{
    this.unfreezeHourGlass(); 
    return
  }

  playGameOver = async () => {
    this.game.getHost().notifyGameEnd();
    const message = jsonWrap('Game Over');
    await this.game.getStageChannel().send(message);
    this.game.quit();
  }

  startGame = async () => {
    this.game.unlockPlayerChannels();
    this.unfreezeHourGlass();
  }

  updatePhase = () => {
    this.previousPhase = this.phase;

    this.phase = this.nextPhase;
    this.increaseTime(this.phase.duration);

    if ( this.phase.shouldLockChannel )
      this.game.getStageChannelManager().lock();
    else 
      this.game.getStageChannelManager().unlock();

    const next = this.phase.next;
    this.nextPhase = this.phases.find(p => p.name === next);
    
    return this.phase.name;
  }

  
  determineRound = () => {
    const numberOfTurns = this.turn;
    const numberOfPlayers = this.game.getPlayers().length;
    const numberOfRounds = Math.ceil(numberOfTurns/numberOfPlayers);
    return numberOfRounds;
  }


  skipPhase = () => this.secondsLeft = 0

  terminateHourGlass = () => clearInterval(this.timer)

  increaseTime = (seconds:number) => seconds > 0 && (this.secondsLeft += seconds)

  // ------------------------- Setters and Getters

  getRound = () => this.round   
  setRound = ( a: number ) => this.round = a

  getPhase = () => this.phase
  setPhase = ( a: Phase ) => this.phase = a

  getNextPhase = () => this.nextPhase
  setNextPhase = ( a: Phase ) => this.nextPhase=a

  getSecondsLeft = () => this.secondsLeft
  setSecondsLeft = ( a: number ) => this.secondsLeft = a

  getPreviousPhase = () => this.previousPhase
  setPreviousPhase = ( a: Phase ) => this.previousPhase = a

  getRemindTime = () => this.remindTime
  setRemindTime = ( a: boolean ) => this.remindTime = a
  
}

module.exports = Clock;