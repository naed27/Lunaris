const util = require("../Essentials/utility");
const {MessageEmbed, Guild} = require('discord.js');

class Embed{

    name;
    embed;
    address
    collector;

    constructor(name,embed,address){
        this.name = name;
        this.embed = embed;
        this.address = address;
    }
   
    //  setters and getters

    getName(){return this.name;}
    setName(a){this.name = a;}

    getEmbed(){return this.embed;}
    setEmbed(a){this.embed = a;}

    getAddress(){return this.address;}
    setAddress(a){this.address = a;}

    getCollector(){return this.collector;}
    setCollector(a){this.collector = a;}
    
}

module.exports = Embed;