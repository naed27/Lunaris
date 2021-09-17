const {parseCommand} = require('../../../Helpers/toolbox')
const { PREFIX } = require('../../variables/variables');
const res = require('../../misc/responses');
const {delay} = require('../../../Helpers/toolbox');

class Channel{
    
  name;
  game;
  owner;
  discordConnection;
  collector;
  timeLeftMessage;

  alertMessage;

  commandListNotebook;

  constructor(name,channel,game=null,owner=null){
    this.owner = owner;
    this.name = name;
    this.game = game;
    this.discordConnection = channel;
  }

  //  setters and getters

  getOwner(){return this.owner}
  
  getName(){return this.name;}
  setName(a){this.name = a;}

  getDiscordConnection(){return this.discordConnection;}
  setChannel(a){this.discordConnection = a;}

  setCollector(a){this.collector=a}
  getCollector(){return this.collector;}

  setTimer(a){this.timer=a}
  getTimer(){this.timer}

  // channel signs

  getChannelMessage(){return this.alertMessage;}
  setChannelMessage(a){this.alertMessage=a}

  getCommandListNotebook(){return this.commandListNotebook}
  setCommandListNotebook(a){this.commandListNotebook=a}


  showAndUnlock(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      SEND_MESSAGES:true,
      VIEW_CHANNEL: true,
      READ_MESSAGE_HISTORY:true 
    });
  }

  hideAndLock(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      SEND_MESSAGES:false,
      VIEW_CHANNEL: false,
      READ_MESSAGE_HISTORY:false 
    });
  }

  unlock(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      SEND_MESSAGES:true,
    });
  }

  lock(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      SEND_MESSAGES:false,
    });
  }

  hide(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      VIEW_CHANNEL: false,
      READ_MESSAGE_HISTORY:false 
    });
  }

  show(id=this.owner.getId()){
    this.discordConnection.permissionOverwrites.edit(id,{ 
      VIEW_CHANNEL: true,
      READ_MESSAGE_HISTORY:true 
    });
  }






// -----------------------------------------

  async alertChannel(message){

    if(this.game.getClock().getHourSand()<message.duration)
      message.duration = this.game.getClock().getHourSand()*1000;

    this.deletePreviousAlertMessage();
    this.alertMessage = await this.discordConnection.send({content:'\n',embeds:[message.embed]}).catch();

    if(message.duration!=0){
      await this.alertMessage.delete(message.duration);
      this.alertMessage=null;
    }
  }

  deletePreviousAlertMessage(){
    if(this.alertMessage){
      this.alertMessage.delete().catch();
      this.alertMessage=null;
    }
  }

// -----------------------------------------

  async showCommandList(){
    this.deletePreviousCommandListNotebook();
    const response = res.commandListOpen(this.owner);
    this.commandListNotebook = await this.discordConnection.send({content:'\n',embeds:[response.embed]}).catch();

    await this.commandListNotebook.react('↩️');
    
    const filter = user => !user.bot;

    const collector = this.commandListNotebook.createReactionCollector({filter});

    collector.on('collect', async (reaction,user) => {
      if(user.bot)return 
      switch(reaction.emoji.name){
        case "📗": {
          this.commandListNotebook.edit({embeds:[response.embed]});
          await this.commandListNotebook.reactions.removeAll();
          this.commandListNotebook.react('↩️');
          }
        break;
        case "↩️": {
            this.commandListNotebook.edit({embeds:[res.commandListClosed().embed]});
            await this.commandListNotebook.reactions.removeAll();
            this.commandListNotebook.react('📗');
          }
        break;
      }
    });
  }

  deletePreviousCommandListNotebook(){
    if(this.commandListNotebook){
      this.commandListNotebook.delete().catch();
      this.commandListNotebook=null;
    }
  }

// -----------------------------------------

  async messageChannel({content='\n',embed=[]}){
    await this.discordConnection.send({content:content,embeds:[embed]}).catch()
  }

// -----------------------------------------

  async countDown(seconds){

    await this.game.getFunctions().cleanChannel(this.discordConnection);
    const timer = await this.discordConnection.send(`‎Game will start in ${seconds}...`).catch();
    for (let i = seconds;i!=0;i--){
      await timer.edit(`‎Game will start in ${i}...`).catch();
      await delay(1500);
    }
    await timer.delete();

  }

  async updateTimeReminder({phase,hourSand}){
    if(hourSand>5||hourSand<1){
      if(!this.timeLeftMessage)return
      this.timeLeftMessage.delete();
      this.timeLeftMessage=null;
      return
    }

    if(!this.timeLeftMessage)
      this.timeLeftMessage = await this.discordConnection.send(`‎${phase} will end in ${hourSand}...`).catch();
    this.timeLeftMessage.edit(`${phase} will end in ${hourSand}...`).catch();
  }









  
  setupListener(){
    const filter = m => !m.author.bot || m.author.id===this.owner.getId();
    this.collector = this.discordConnection.createMessageCollector({filter})

    this.collector.on('collect', async message => {
      await message.delete().catch();
      if(message.content.startsWith(PREFIX)){
        
        // parse the command
        const [COMMAND_KEYWORD,ARGUMENTS] = parseCommand(PREFIX,message.content);
        
        // find command from the given keyword
        const foundCommands = this.owner.findCommand(COMMAND_KEYWORD);

        // if the player typed an invalid command
        if(foundCommands.length===0){
          return this.alertChannel(res.commandUnavailable());
        } 

        // if the player invoked multiple commands using 1 command name
        if(foundCommands.length>1){
          return this.alertChannel(res.multipleCommands(COMMAND_KEYWORD,foundCommands));
        }

        // if the player called a valid and unique command

        // initiate the command
        const command = foundCommands[0];

        // if the command doesnt require any targets, run and exit
        if(command.RequiredNumberOfTargets===0)
          return command.Run({
            user:this.owner,
            command:command,
            game:this.game,
            args:ARGUMENTS
          })

        // if the command has a target

        // if no arguments is supplied
        if(ARGUMENTS.length===0)
        return this.messageChannel(res.pleaseProvideAnArgument(command));

        // find target from the given keyword
        const performer = this.owner;
        const targetables = command.Targetables({
          user:this.owner,
          game:this.game
        });

        // separate the target from the arguments
        const {response,target,args} = this.game.getFunctions().parseArguments(command,ARGUMENTS,targetables);
        console.log(`
          response: ${response}\n
          target: ${target}\n
          args: ${args}
        `)
        // if target is not found or invalid, escape out of function
        if(!response)return;

        // if the command is instant, run it immediately and exit out
        if(command.Cast==='Instant')
          return command.Run({
            user:this.owner,
            command:command,
            target:target,
            game:this.game,
            args:args
        });

        // if the command is normal type

        // push the command into the game to run it later
        this.game.pushAction({
          user:this.owner,
          performer:performer,
          command:command,
          target:target,
          args:args
        });

        // send a response that the command will run later
        this.messageChannel(res.commandResponse(await command.Response({
          user:this.owner,
          command:command,
          target:target,
          game:this.game,
          arguments:args
        })));
          
      return
      //  -------------- NON  COMMANDS ----------------
      }else{
        switch(this.game.getClock().getPhase()){
          case "In Lobby":
          case "Discussion": 
          case "Voting":
          case "Judgement":
          case "Execution":
          case "Defense":
          case "Game Over":
          case "Final Words":
            if(this.owner.getStatus()=="Alive"){

              const playerMessage = `‎\n**${this.owner.getUsername()}:** ${message.content}`;
              this.game.getFunctions().messagePlayers(playerMessage);
              
            }else{

              const playerMessage = `‎\n**Dead ${this.owner.getUsername()}:** ${message.content}`;
              this.game.getFunctions().messageGhosts(playerMessage);

            }
          break;
          
          case "Night":
          case "Night (Full Moon)":
            
            this.alertChannel(res.cantTalkAtNight());

          break;
          default:
            null
          break;
        }
        return
      }
    });
  }
}

module.exports = Channel;