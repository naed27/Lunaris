const util = require("../Essentials/utility");
const {MessageEmbed} = require('discord.js');

class Player{
    
    id;
    avatar;
    characters=[];
    chatCollector;
    deafStatus = "Listening";
    deafened = false;

    constructor(id,characters){
        this.id = id;
        this.characters = characters;
        this.avatar = characters[0];
    }

    getID(){return this.id;}

    setAvatar(a){this.avatar = a;}
    getAvatar(){return this.avatar;}

    pushCharacter(a){this.character.push(a);}
    getCharacters(){return this.characters;}

    setChatCollector(a){this.chatCollector=a;}
    getChatCollector(){return this.chatCollector;}

    setDeafStatus(a){this.deafStatus=a;}
    getDeafStatus(){return this.deafStatus;}

    setDeaf(a){this.deafened=a;}
    isDeaf(){return this.deafened;}

   

    
}

module.exports = Player;