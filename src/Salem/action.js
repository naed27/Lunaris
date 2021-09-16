const util = require("./utility");
const {MessageEmbed} = require('discord.js');

class Action{

    user;
    performer;
    command;
    targets;
    status;

    constructor(user,performer,command,targets){
        this.user = user;
        this.performer = performer;
        this.command = command;
        this.targets = targets;
        this.status = "Pending";
    }

    // ------------------------------------- SETTERS AND GETTERS

    getUser(){return this.user;}
    setUser(a){this.user=a;}

    getPerformer(){return this.performer}
    setPerformer(a){this.performer = a}    

    getCommand(){return this.command}
    setCommand(a){this.command = a}

    getTargets(){return this.targets;}
    setTargets(a){this.targets = a;}

    getFirstTarget(){return this.targets[0];}
    setFirstTarget(a){this.targets[0] = a}

    getSecondTarget(){
      if(this.targets.length==2){
        return this.targets[1];
      }else{
        return null;
      }
      
    }
    setSecondTarget(a){
      if(this.targets.length==2){
        this.targets[1] = a
      }
    }

    getStatus(){return this.status;}
    setStatus(a){this.status=a;}

}

module.exports = Action;