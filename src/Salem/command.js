const util = require("./utility");
const commands = require("./commands");
const {MessageEmbed} = require('discord.js');

class Command{

  name;
  guide;
  description;
  priority;
  stocks;
  permission;
  queue;
  requiredTargets;
  phase;
  status;

  performer;
  visitsTarget;
  autoTargets;
  validTargets;
  actionResponse;
  act;
  
  process;

    constructor(command,type){
        this.name=command.Name;
        this.guide=command.Guide;
        this.description=command.Description;
        this.priority=command.Priority;
        this.stocks=command.Stocks;
        this.permission = command.Permission;
        this.queue = command.Queue;
        this.requiredTargets=command.RequiredTargets;
        this.phase=command.Phase;
        this.status=command.Status;
        
        if(type=="Role"){
          this.performer=command.Performer;
          this.visitsTarget=command.VisitsTarget;
          this.validTargets=command.ValidTargets;
          this.actionResponse=command.ActionResponse;
          this.act=command.Act;
          this.autoTargets=command.AutoTargets;
        }else{
          this.process=command.Process;
        }
    }

    // ------------------------------------- SETTERS AND GETTERS

    Performer(user,command,town){
      return this.performer(user,command,town);
    }

    VisitsTarget(user,town){
      return this.visitsTarget(user,town);
    }

    AutoTargets(user,town){
      return this.autoTargets(user,town);
    }

    ValidTargets(user,town){
       return this.validTargets(user,town);
    }

    async ActionResponse(user,command,inputs,town){
        return this.actionResponse(user,command,inputs,town);
    }

    Act(user,performer,command,targets,town){
      this.act(user,performer,command,targets,town);
    }

    Process(user,town,inputs){
      this.process(user,town,inputs);
    }

    getName(){return this.name;}
    setName(a){this.name=a;}

    getGuide(){return this.guide}
    setGuide(a){this.guide=a;}

    getDescription(){return this.description;}
    setDescription(a){this.description=a}

    getPriority(){return this.priority;}
    setPriority(a){this.priority=a}

    getStocks(){return this.stocks;}
    setStocks(a){this.stocks=a;}

    getPermission(){return this.permission}
    setPermission(a){this.permission=a}

    getQueue(){return this.queue;}
    setQueue(a){this.queue=a}

    getRequiredTargets(){return this.requiredTargets;}
    setRequiredTargets(a){this.requiredTargets=a}

    getPhase(){return this.phase;}

    getStatus(){return this.status;}

    getId(){return this.id}
    setId(a){this.id=a}
    
   

}

module.exports = Command;