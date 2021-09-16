const util = require("./utility");
const {MessageEmbed, Util} = require('discord.js');
const { delay } = require("./utility");

class Clock{

    //cores
    town;
    Lwrap = `‎\n\`\`\`json\n`;
    Rwrap = `\`\`\``;

    //phasing
    phase="In Lobby";
    previousPhase;
    nextPhase;
    round;
    
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
    hourFlag=false;
    hourGlass;
    hourSand=0;
    hourChange=false;
    remindTime = false;

  

    //clocker
    clockers=[];
    
    constructor(town){
        this.town = town;
    }

    // ------------------------------------- FUNCTIONS

    async timeReminder(){
        if(this.hourSand>5||this.hourSand<1){
            let pl = this.town.getPlayers();
            for (let i = 0; i < pl.length; i++) {
                if(pl[i].getHouse().getTimer()){
                    pl[i].getHouse().getTimer().delete();
                    pl[i].getHouse().setTimer(null);
                }else{
                    break;
                }
            }
        }else{
            for (const player of this.town.getPlayers()) {
                if(player.getHouse().getTimer()){
                    player.getHouse().getTimer().edit(`‎‎\n${this.phase} will end in ${this.hourSand}...`).catch(error=>{});
                }else{
                    player.getHouse().setTimer(await player.getHouse().getChannel().send(`‎\n‎${this.phase} will end in ${this.hourSand}...`).catch(error=>{}));
                }
            }
        }
    }

    async theHourGlass(){
        this.hourGlass = setInterval(async () => {
            this.updateTownClock();
            if(this.hourFlag){
                if(this.remindTime){
                    this.timeReminder();
                }
                if(this.hourSand>0){
                    this.hourSand--;
                }else{
                    this.freezeHourGlass();
                    this.phaseProcessor();
                }
            }
        }, 1500);
    }

    async phaseProcessor(){
        this.previousPhase = this.phase;
        this.phase=this.nextPhase;
        switch(this.getPhase()){
            case "Reporting":await this.playReporting();
                break;
            case "Discussion":await this.playDiscussion();
                break;
            case "Voting":await this.playVoting();
                break;
            case "Defense":await this.playDefense();
                break;
            case "Judgement":await this.playJudgement();
                break;
            case "Final Words":await this.playFinalWords();
                break;
            case "Execution":await this.playExecution();
                break;
            case "Night":await this.playNight();
                break;
            case "Night (Full Moon)":await this.playNight();
                break;
            case "Calculation":await this.playCalculation();
                break;
            case "Game Over":await this.playGameOver();
                break;
        }
        
        this.town.getSetup().listenHouseChannel();
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
        this.town.getSetup().closeHouseChannels();
        this.nextPhase = "Calculation";
        message = `Day ${this.round}.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await this.town.deathListener();
        await this.town.rebornListener();
        
        this.addTime(this.reportingDuration);
        this.moveHourGlass();  
    }

    async playDiscussion(){
        let message;
        this.town.getSetup().openHouseChannels();
        if(this.round>1){
            this.remindTime=true;
            this.addTime(this.discussionDuration);
            this.nextPhase = "Voting";
            message = `Day ${this.round}: The Discussion.\nDuration: ${this.hourSand}s`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
    
            if(this.maxPeaceCount-this.peaceCount==1){
                await util.delay(1000);
                message = `The game will end in a draw if no one dies tomorrow.`;
                message = `${this.Lwrap}${message}${this.Rwrap}`;
                await this.town.getFunctions().messagePlayers(message);
            }

            await this.town.updatePlayerLists();
        }else{
            this.nextPhase = "Night";
            this.addTime(15);
            this.remindTime=true;
            message = `Day ${this.round}: The Discussion.\nDuration: ${this.hourSand}s`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
        }
        this.moveHourGlass();  
    }

    async playVoting(){
        this.remindTime=true;
        let message;
        if(this.round%2==0){
            this.nextPhase = "Night (Full Moon)";
        }else{
            this.nextPhase = "Night";
        }

        if(this.previousPhase=="Discussion"){
            this.addTime(this.votingDuration); //full time
        }else if(this.previousPhase=="Calculation"){
            this.addTime(this.getVotingExcessTime());
            this.town.getSetup().openHouseChannels();
        }

        message = `Day ${this.round}: The ${this.phase}.\nDuration: ${this.hourSand}s\Type ".vote <player>" to vote someone!`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        
        this.moveHourGlass();
    }

    async playDefense(){
        this.remindTime=true;
        let message;
        this.nextPhase = "Judgement";
        this.addTime(this.defenseDuration);
        this.town.getSetup().closeHouseChannels();
        await util.delay(2000);

        message = `The town seems to want to execute ${this.town.getVotedUp().getUsername()}.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await util.delay(3000);

        message = `${this.town.getVotedUp().getUsername()} was dragged up into the center platform.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await util.delay(4000);

        message = `${this.town.getVotedUp().getUsername()}, what's your defense?`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await util.delay(2000);
        message = `Day ${this.round}: ${this.town.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.hourSand}s`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        this.town.getVotedUp().getHouse().open();

        this.moveHourGlass(); 
    }

    async playJudgement(){
        this.remindTime=true;
        let message;
        this.nextPhase = "Calculation";

        this.addTime(this.judgmentDuration);

        message = `Day ${this.round}: The ${this.phase}.\nDuration: ${this.hourSand}s`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;await this.town.getFunctions().messagePlayers(message);
        await util.delay(2000);

        this.town.getSetup().setupJudgementCollector();
        this.moveHourGlass(); 
    }

    async playFinalWords(){
        this.remindTime=true;
        let message;
        this.nextPhase = "Execution";
        this.addTime(this.finalWordsDuration);
        
        message = `Day ${this.round}: ${this.town.getVotedUp().getUsername()}'s ${this.phase}.\nDuration: ${this.hourSand}s`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);

        this.moveHourGlass(); 
    }

    async playExecution(){
        
        this.remindTime=false;
        let message;

        if(this.round%2==0){
            this.nextPhase = "Night (Full Moon)";
        }else{
            this.nextPhase = "Night";
        }
        
        this.addTime(this.executionDuration);

        message = `Day ${this.round}: ${this.town.getVotedUp().getUsername()}'s ${this.phase}.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await util.delay(3000);

        message = `After placing the rope around the neck, they took away the wooden footrest...`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await util.delay(5000);

        message = `...And with it, followed ${this.town.getVotedUp().getUsername()}'s final breath.`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);

        this.town.getVotedUp().kill();
        this.town.clearFreshDeaths();
        await util.delay(2000);

        if(this.town.getVotedUp().getRole().getName()=="Jester"){
            message = `${this.town.getVotedUp().getUsername()} will get his revenge!`;
            message = `${this.Lwrap}${message}${this.Rwrap}`;
            await this.town.getFunctions().messagePlayers(message);
            this.town.getVotedUp().setWinStatus(true);
            this.town.getVotedUp().getRole().getCommands().filter(c=>c.getName()=="haunt")[0].setStocks(1);
        }
        
        await this.town.getVotedUp().playDeath();

        await this.town.updatePlayerLists();

        this.town.listenForWinners();




        this.moveHourGlass();
    }

    async playNight(){
        
        this.remindTime=true;
        this.town.clearVotes();
        let message;
        this.addTime(this.nightDuration);
        this.nextPhase = "Calculation";
        await this.town.getSetup().closeHouseChannels();
        this.town.resetNight();

        this.town.updateWerewolf();
        
        if(this.phase=="Night"){
            message = `Night ${this.round}.\nDuration: ${this.hourSand}s`;
        }else{
            message = `Night ${this.round}. (Full Moon)\nDuration: ${this.hourSand}s`; 
        }
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);
        await this.town.getFunctions().promoteMafia();

        await this.town.processActions();
        await this.town.getSetup().openHouseChannels();

        this.moveHourGlass(); 
    }

    async playCalculation(){
        this.remindTime=false;
        let message="";
        this.addTime(this.calcDuration);
        switch(this.previousPhase){
            case "Night":
            case "Night (Full Moon)":
                this.nextPhase = "Reporting";
                this.town.processActions();
                break;
            case "Reporting":
                this.nextPhase = "Discussion";
                this.town.listenForWinners();
                this.town.resetDay();
                if(this.peaceCount==this.maxPeaceCount){
                    this.setNextPhase("Game Over");
                    this.skipPhase();
                }
                break;
            case "Judgement":
                let isGuilty = await this.town.getSetup().finalJudgements();
                if(isGuilty){
                    this.nextPhase = "Final Words";
                    await util.delay(2000);
                    message = `The votes has declared ${this.town.getVotedUp().getUsername()} guilty!`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    await this.town.getFunctions().messagePlayers(message);
                    await util.delay(3000);

                    message = `${this.town.getVotedUp().getUsername()}, do you have any last words?`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    await this.town.getFunctions().messagePlayers(message);
                    await util.delay(2000);
                }else{
                    this.nextPhase = "Voting";
                    await util.delay(2000);
                    message = `The votes has declared ${this.town.getVotedUp().getUsername()} innocent!`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    await this.town.getFunctions().messagePlayers(message);
                    await util.delay(2000);
                    this.town.set
                    this.town.clearVotes();

                    message = `${this.town.getVotedUp().getUsername()} walks down the executional platform.`;
                    message = `${this.Lwrap}${message}${this.Rwrap}`;
                    await this.town.getFunctions().messagePlayers(message);
                    await util.delay(2000);
                }
                break;
            case "In Lobby":
                    this.town.gameStart();
                break;
        }
        
        this.moveHourGlass(); 
    }

    async playGameOver(){
        
        let message;
        let winners = this.town.getPlayers().filter(p=>p.getWinStatus()==true);
        this.town.getHost().notifyGameEnd();

        message = `Game Over`;
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().messagePlayers(message);

        message = this.town.getFunctions().stringifyWinners(winners);
        message = `${this.Lwrap}${message}${this.Rwrap}`;
        await this.town.getFunctions().farewellMessage(message);

        for await(const player of this.town.getPlayers()) {
            player.getHouse().open();
            player.getNotepad().hideAndClose();
            player.getHouse().setTimer(await player.getHouse().getChannel().send(`‎Game will shutdown in 10...`).catch(error=>{}));
        }
        for(let i = 10;i!=0;i--){
            await util.delay(1500);
            for (const player of this.town.getPlayers()) {
                if(player.getHouse().getTimer()){
                    player.getHouse().getTimer().edit(`‎Game will shutdown in ${i}...`).catch(error=>{});
                }
            }
        }
        await util.delay(1500);
        this.town.quit();
    }

    async startGame(){
        this.round=1;
        this.nextPhase="Discussion";
        this.town.getSetup().openNotepadChannels();
        this.town.getSetup().openHouseChannels();
        this.moveHourGlass();
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

        let clockChannels = this.town.getClockChannels();

        for (const ch of clockChannels) {
            let temp = await ch.getChannel().send(embed).catch(error=>{});
            this.clockers.push(temp)
        }
      
    }

    async updateTownClock(){
        let half=``;
        if(this.phase!="Night" || this.phase!="Night (Full Moon)" ){
            half = "Day";
        }else{
            half = "Night"
        }

        let title = `Town Clock`;
        let body=``;
        if(this.phase=="In Lobby"){
            body = `Game will auto-start in ${this.hourSand}s`
        }else{
            body = `${half} ${this.round}\nCurrent Phase: ${this.phase}\nTime Left: ${this.hourSand}`;
        }
        
        let footer = ``;




        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle(`${title}`)
        .setDescription(`${body}`)
        .setFooter(`${footer}`);

        this.clockers.forEach(cl => {
            cl.edit(embed).catch(error=>{});
        });

    }

    addTime(seconds){
        this.hourChange=true;
        this.hourSand+=seconds;
        if(this.hourSand<0){
            this.hourSand=0;
        }
    }

    getHourSand(){return this.hourSand;}
    setHourSand(a){this.hourSand=a}

    skipPhase(){
        this.hourSand=0;
    }

    freezeHourGlass(){
        this.hourFlag=false;
    }

    moveHourGlass(){
        this.hourFlag=true;
    }

    terminateHourGlass(){clearInterval(this.hourGlass);}
 

    // ------------------------------------- SETTERS / GETTERS
    getPhase(){return this.phase;}

    
    getPreviousPhase(){return this.previousPhase;}
    setPreviousPhase(a){this.previousPhase=a;}

    getNextPhase(){return this.nextPhase;}

    setNextPhase(a){this.nextPhase=a;}

    getRound(){return this.round;}
   
    getRemindTime(){return this.remindTime;}
    setRemindTime(a){this.remindTime=a}

    getVotingExcessTime(){return this.votingExcessTime;}
    setVotingExcessTime(a){this.votingExcessTime=a;}
    resetVotingExcessTime(){this.votingExcessTime=0;}

    getPeaceCount(){return this.peaceCount;}
    setPeaceCount(a){this.peaceCount=a}

    

}

module.exports = Clock;