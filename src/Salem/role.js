const util = require("./utility");
const commands = require("./commands");
const {MessageEmbed} = require('discord.js');
const Command = require("./command");
const Result = require("./result");

class Role{

    player;
    id;
    name;
    alignment;
    type;
    immunities;
    attack;
    defense;
    results;
    abilities;
    goals;
    nightMessage;
    roleMessage;
    friendlies;
    commands=[];

    constructor(role){
        
        this.id=role.id;
        this.name=role.Name;
        this.alignment=role.Alignment;
        this.type=role.Type;
        this.immunities=role.Immunities;
        this.attack = role.Attack;
        this.defense = role.Defense;
        this.results=new Result(role.Results);
        this.abilities=role.Abilities;
        this.goals=role.Goals;
        this.nightMessage=role.NightMessage;
        this.roleMessage=role.RoleMessage;
        this.friendlies = role.Friendlies

        role.Commands.forEach(c => {
            this.commands.push(new Command(c,"Role"));
        });

        commands.list.forEach(c => {
            this.commands.push(new Command(c,"Game"));
        });

    }

    // ------------------------------------- SETTERS AND GETTERS

    getPlayer(){return this.player;}
    setPlayer(a){this.player=a;}

    getId(){return this.id}
    setId(a){this.id=a}
    
    getName(){return this.name}
    setName(a){this.name=a}

    getAlignment(){return this.alignment;}
    setAlignment(a){this.alignment=a;}

    getType(){return this.type;}
    setType(a){this.type=a}

    getImmunities(){return this.immunities;}
    pushImmunity(a){this.immunities.push(a);}

    getAttack(){return this.attack;}
    setAttack(a){this.attack=a;}
    getDefense(){return this.defense;}
    setDefense(a){this.defense=a;}

    getResults(){return this.results;}
    setResults(a){this.results=a}

    getAbilities(){return this.abilities;}
    pushAbility(a){this.abilities.push(a);}

    getGoals(){return this.goals;}
    pushGoal(a){this.goals.push(a);}

    getNightMessage(){return this.nightMessage;}
    setNightMessage(a){this.nightMessage=a;}

    getRoleMessage(){return this.roleMessage;}
    setRoleMessage(a){this.roleMessage=a;}

    getFriendlies(){return this.friendlies;}
    setFriendlies(a){this.friendlies=a}
    pushFriendly(a){this.friendlies.push(a);}
    clearFriendlies(){this.friendlies=[];}

    getCommands(){return this.commands;}
    pushCommand(a){this.commands.push(a)}

}

module.exports = Role;