const util = require("./utility");
const {MessageEmbed} = require('discord.js');

class Result{

    investigator;
    sheriff;
    consigliere;

    constructor(Results){
      this.investigator = Results.Investigator;
      this.sheriff = Results.Sheriff;
      this.consigliere = Results.Consigliere;
    }

    // ------------------------------------- SETTERS AND GETTERS

    getInvestigator(){return this.investigator;}
    setInvestigator(a){this.investigator=a;}

    getSheriff(){return this.sheriff}
    setSheriff(a){this.sheriff = a}    

    getConsigliere(){return this.consigliere}
    setConsigliere(a){this.consigliere = a}


}

module.exports = Result;