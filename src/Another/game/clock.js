const { delay } = require("../../Helpers/toolbox");
const {createEmbed} = require('../utility/utility');
const {wrap} = require('../utility/utility');

class Clock{

    //cores
    game;

    //phasing
    phase="In Lobby";
    previousPhase;
    nextPhase;
    round;
    
    //durations
    lobbyDuration = 20;
    reportingDuration = 0;
    firstDiscussionDuration = 10;
    discussionDuration = 200;
    votingDuration = 10;
    executionDuration = 10;
    nightDuration = 200;
    calcDuration = 0;
    testDuration = 100;


    //timers
    hourFlag=false;
    hourGlass;
    hourSand=0;
    remindTime = false;

    //clocker
    clockMessageAddresses=[];
    
    constructor(game){
        this.game = game;
    }

    // ------------------------------------- FUNCTIONS

    async timeReminder(){
      this.game.getPlayers().forEach( player => {
        player.getPersonalChannel().updateTimeReminder({
          phase:this.phase,
          hourSand:this.hourSand
        });
      });
    }

    runHourGlass(){
      this.hourGlass = setInterval(() => {
        this.updateTownClock();
        if(this.hourFlag){
          if(this.remindTime){
            this.timeReminder();
          }
          if(this.hourSand>0){
            this.hourSand--;
          }else{
            this.freezeHourGlass();
            this.processPhase();
          }
        }
      }, 1500);
    }

    freezeHourGlass(){
      this.hourFlag=false;
    }

    moveHourGlass(){
      this.hourFlag=true;
    }

    async processPhase(){
      this.previousPhase = this.phase;
      this.phase = this.nextPhase;
      switch(this.getPhase()){
        case "Reporting": this.playReporting();
          break;
        case "Discussion": this.playDiscussion();
          break;
        case "Voting": this.playVoting();
          break;
        case "Defense": this.playDefense();
          break;
        case "Judgement": this.playJudgement();
          break;
        case "Final Words": this.playFinalWords();
          break;
        case "Execution": this.playExecution();
          break;
        case "Night": this.playNight();
          break;
        case "Calculation": this.playCalculation();
          break;
        case "Game Over": this.playGameOver();
          break;
      }
      
    }

    async playLobby(){
      
      this.remindTime=false;
      this.nextPhase = "Calculation";
      this.addTime(this.lobbyDuration);
      this.moveHourGlass();  
    }

    async playReporting(){
      this.remindTime=false;
      this.round++;
      let message;
      this.game.getFunctions().lockStudentChannels();
      this.nextPhase = "Calculation";
      message = `Day ${this.round}.`;
      await this.game.getFunctions().gameMessage(message);
      this.game.incrementPeaceCount();
      await this.game.getFunctions().deathListener();
      this.addTime(this.reportingDuration);
      this.moveHourGlass();  
    }

    async playDiscussion(){
      
      // set some stuff
      this.remindTime=true;
      let message;
      this.game.getFunctions().unlockStudentChannels();
      if(this.round>1){

        // add time and set next phase
        this.addTime(this.discussionDuration);
        this.nextPhase = "Voting";
        
        // show everyone who are left alive
        await delay(1500);
        await this.game.getFunctions().whoArrivedAtTheSchoolSafely();
        
        await delay(1000);
        // phase notification
        message = `Day ${this.round}: The Discussion.\nDuration: ${this.hourSand}s`;
        await this.game.getFunctions().gameMessage(message);
        
        // notify everyone that the game is nearing a draw
        if(this.game.getRemainingPeace()==1){
          await delay(1000);
          message = `The game will end in a draw if no one dies tomorrow.`;
          await this.game.getFunctions().gameMessage(message);
        }


      }else{

        // set phase for the first day
        this.nextPhase = "Night";
        this.addTime(this.firstDiscussionDuration);
        message = `Day ${this.round}: The Discussion.\nDuration: ${this.hourSand}s`;
        await this.game.getFunctions().gameMessage(message);

      }

      this.moveHourGlass();  
    }

    async playVoting(){

      // set some stuff
      let message;
      this.remindTime=true;
      this.nextPhase = "Night";
      this.addTime(this.votingDuration);

      // phase notification
      message = `Day ${this.round}: The ${this.phase}.\nDuration: ${this.hourSand}s\nType ".vote <player>" to vote someone!`;
      await this.game.getFunctions().gameMessage(message);
      
      this.moveHourGlass();
      return
    }

    async playFinalWords(){

      // set stuff
      this.remindTime=true;
      let message;
      this.nextPhase = "Execution";
      this.addTime(this.finalWordsDuration);
      
      // phase notification
      message = `Day ${this.round}: ${this.game.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.hourSand}s`;
      await this.game.getFunctions().gameMessage(message);

      // resume the hour glass
      this.moveHourGlass(); 
      return
    }

    async playExecution(){
        
      // set stuff
      let message;
      this.remindTime=false;
      this.nextPhase = "Night";
      this.addTime(this.executionDuration);

      // tell how the ghosthunt will turn out
      message = `The students gathered in at Person X's house`;
      await this.game.getFunctions().gameMessage(message);
      await delay(4000);

      message = `Person B took out his holy water`;
      await this.game.getFunctions().gameMessage(message);
      await delay(3000);

      message = `And then the ghost is supposed to die here`;
      await this.game.getFunctions().gameMessage(message);
      await delay(4000);

      // process some stuff
      this.game.getVotedUp().kill();
      this.game.clearFreshDeaths();
      await this.game.getVotedUp().playDeath();
      await this.game.updatePlayerLists();
      this.game.listenForWinners();
      this.moveHourGlass();
      return
    }

    async playNight(){
      
      // set some stuff
      this.remindTime=true;
      this.game.clearVotes();
      this.nextPhase = "Calculation";
      this.addTime(this.nightDuration);
      await this.game.getFunctions().lockStudentChannels();

      // phase notification
      const message = `Night ${this.round}.\nDuration: ${this.hourSand}s`;
      await this.game.getFunctions().gameMessage(message);

      await this.game.getFunctions().unlockStudentChannels();
      this.moveHourGlass(); 
      return
    }

    async playCalculation(){
      this.remindTime=false;
      this.addTime(this.calcDuration);
      switch(this.previousPhase){
        case "Night":
          this.game.getFunctions().processActions();
          this.nextPhase = "Reporting";
          break;
        case "Reporting":
          this.nextPhase = "Discussion";
          this.game.getFunctions().listenForWinners();
          this.game.getFunctions().resetDay();
          if(this.game.getRemainingPeace()===0){
            this.setNextPhase("Game Over");
            this.skipPhase();
          }
          break;
        case "Voting":{
          
            this.nextPhase = "Night";
            await delay(2000);
            const message = `The students will try to challenge the ghost tonight!`;
            await this.game.getFunctions().gameMessage(message);
            await delay(3000);

        }
        break;
        case "In Lobby":
          this.game.gameStart();
        break;
      }

      this.moveHourGlass(); 
      return
    }

    async playGameOver(){
        
        let message;
        let winners = this.game.getPlayers().filter(p=>p.getWinStatus()==true);
        this.game.getHost().notifyGameEnd();

        message = `Game Over`;
        await this.game.getFunctions().gameMessage(message);

        message = this.game.getFunctions().stringifyWinners(winners);
        await this.game.getFunctions().farewellMessage(wrap(message));

        this.game.getPlayers().forEach(async player => {
          player.getPersonalChannel().unlock();
          player.getPersonalChannel().setTimer(await player.getPersonalChannel().getDiscordConnection().send(`‎Game will shutdown in 10...`).catch());
        
        });

        for(let i = 10;i!=0;i--){
          await delay(1500);
          for (const player of this.game.getPlayers()) {
            if(player.getPersonalChannel().getTimer()){
                player.getPersonalChannel().getTimer().edit(`‎Game will shutdown in ${i}...`).catch();
            }
          }
        }
        await delay(1500);
        this.game.quit();
        return
    }

    async startGame(){
        this.round=1;
        this.nextPhase="Discussion";
        this.game.getFunctions().unlockStudentChannels();
        this.moveHourGlass();
        return
    }

    async setupTownClock(){
      
      const embed = createEmbed({
        title: `Town Clock`
      });

      const clockChannels = this.game.getClockChannels()
      clockChannels.forEach(async clockChannel => {
        const temp = await clockChannel.getDiscordConnection().send({embeds:[embed]}).catch();
        this.clockMessageAddresses.push(temp)
      });
      return
    }

    async updateTownClock(){
      let half=``;
      if(this.phase!="Night")
        half = "Day";
      half = "Night";
      
      let body=``;
      if(this.phase=="In Lobby"){
          body = `Game will auto-start in ${this.hourSand}s`
      }else{
          body = `${half} ${this.round}\nCurrent Phase: ${this.phase}\nTime Left: ${this.hourSand}`;
      }
      
      const embed = createEmbed({
        title: `Town Clock`,
        body:body
      });

      this.clockMessageAddresses.forEach(messageAddress => {
          messageAddress.edit(embed).catch();
      });
      return
    }

    addTime(seconds){
      this.hourSand+=seconds;
      if(this.hourSand<0){
        this.hourSand=0;
      }
      return
    }

    skipPhase(){
      return this.hourSand=0;
    }

    terminateHourGlass(){return clearInterval(this.hourGlass);}

    // ------------------------------------- SETTERS / GETTERS
    getPhase(){return this.phase;}

    getHourSand(){return this.hourSand;}
    setHourSand(a){return this.hourSand=a}

    getPreviousPhase(){return this.previousPhase;}
    setPreviousPhase(a){return this.previousPhase=a;}

    getNextPhase(){return this.nextPhase;}

    setNextPhase(a){return this.nextPhase=a;}

    getRound(){return this.round;}
   
    getRemindTime(){return this.remindTime;}
    setRemindTime(a){return this.remindTime=a}

    getVotingExcessTime(){return this.votingExcessTime;}
    setVotingExcessTime(a){return this.votingExcessTime=a;}
    resetVotingExcessTime(){return this.votingExcessTime=0;}

    

}

module.exports = Clock;