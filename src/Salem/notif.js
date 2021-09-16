const util = require("../Essentials/utility");
const {MessageEmbed} = require('discord.js');

class Notif{

    toHouseOwner;
    toReceiver;
    toLookout;
    toSpy;


    constructor(performer,command,targets){
        this.performer = performer;
        this.command = command;
        this.targets = targets;
    }

    // ------------------------------------- SETTERS AND GETTERS

    getPerformer(){return this.performer}
    setPerformer(a){this.performer = a}    

    getCommand(){return this.command}
    setCommand(a){this.command = a}

    getTargets(){return this.targets;}
    setTargets(a){this.targets = a;}

    getFirstTarget(){return this.targets[0];}
    setFirstTarget(a){this.targets[0] = a}

    getSecondTarget(){return this.targets[1]}
    setSecondTarget(a){this.targets[1] = a}

}

module.exports = Notif;