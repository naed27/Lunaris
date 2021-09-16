const util = require("../Essentials/utility");
const {MessageEmbed} = require('discord.js');

class Message{
    
    id;
    status;
    content;
    authorID;
    subTargets=[];
    mainTarget;

    constructor(id,status,authorID){
        this.id = id;
        this.status = status;
        this.authorID = authorID;
    }

    getID(){return this.id;}

    setStatus(a){this.status=a;}
    getStatus(){return this.status;}

    setContent(a){this.content=a;}
    getContent(){return this.content;}

    getAuthorID(){return this.authorID;}

    pushSubTarget(a){this.subTargets.push(a);}
    getSubTargets(){return this.subTargets}
    setSubTargets(a){this.subTargets=a;}

    set(a){this.content=a;}
    getContent(){return this.content;}

    getMainTarget(){return this.mainTarget}
    setMainTarget(a){this.mainTarget=a;}
    


}

module.exports = Message;