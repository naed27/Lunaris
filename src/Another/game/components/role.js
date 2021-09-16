const {cloneDeep} = require('lodash');
const GAME_COMMANDS = require('../../misc/commands');

class Role{

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
        this.unique = role.Unique;
        this.abilities=role.Abilities;
        this.goals=role.Goals;
        this.nightMessage=role.NightMessage;
        this.roleMessage=role.RoleMessage;
        this.commands = [
            ...role.Commands.map((command)=>(cloneDeep(command))),
            ...GAME_COMMANDS.map((command)=>(cloneDeep(command)))
        ];
    }

    // ------------------------------------- SETTERS AND GETTERS

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

    getAbilities(){return this.abilities;}
    pushAbility(a){this.abilities.push(a);}

    getGoals(){return this.goals;}
    pushGoal(a){this.goals.push(a);}

    getNightMessage(){return this.nightMessage;}
    setNightMessage(a){this.nightMessage=a;}

    getCommands(){return this.commands}
    setCommands(a){this.commands=a}


}

module.exports = Role;