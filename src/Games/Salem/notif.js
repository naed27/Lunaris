class Notif{

    toSpy;
    toLookout;
    toReceiver;
    toHouseOwner;

    constructor(performer,command,targets){
        this.command = command;
        this.targets = targets;
        this.performer = performer;
    }

    // ------------------------------------- SETTERS AND GETTERS

    getPerformer = () => this.performer
    setPerformer = (a) => this.performer = a;

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