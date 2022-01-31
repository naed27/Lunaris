import globalCommands from "./commands";
import Result from "./result";
import Player from "./player";
import { SalemRole } from "./roles";
import Command from "./command";

export default class Role{

    player: Player;

    id: string;
    name: string;
    type: string;
    goals: string[];
    attack: number;
    defense: number;
    results: Result;
    abilities: string[];
    alignment: string;
    winBuddies: string[];
    immunities: string[];
    roleMessage: string;
    nightMessage: string;
    commands: Command[];

    constructor(role: SalemRole){
        
        this.id = role.id;
        this.name = role.name;
        this.type = role.type;
        this.goals = role.goals;
        this.attack = role.attack;
        this.defense = role.defense;
        this.abilities = role.abilities;
        this.alignment = role.alignment;
        this.winBuddies = role.winBuddies
        this.immunities = role.immunities;
        this.roleMessage = role.roleMessage;
        this.nightMessage = role.nightMessage;
        this.results = new Result(role.results);
        const roleCommands = role.commands.map(command => new Command(command));
        const gameCommands = globalCommands.map(command => new Command(command));
        this.commands = [...roleCommands,...gameCommands];
    }

    // ------------------------------------- SETTERS AND GETTERS


    getId = () => this.id
    setId = (a:string) => this.id = a
    
    getName = () =>  this.name
    setName = (a:string) => this.name = a

    getType = () => this.type
    setType = (a:string) => this.type = a;

    getPlayer = () => this.player
    setPlayer = (a:Player) => this.player = a

    getAttack = () => this.attack
    setAttack = (a:number) => this.attack = a;

    getResults = () => this.results
    setResults = (a:Result) => this.results = a;

    getGoals = () => this.goals
    pushGoal = (a:string) => this.goals.push(a);

    getDefense = () => this.defense
    setDefense = (a:number) => this.defense = a;

    getAlignment = () => this.alignment
    setAlignment = (a:string) => this.alignment = a;

    getAbilities = () => this.abilities
    pushAbility = (a:string) => this.abilities.push(a);

    getRoleMessage = () => this.roleMessage
    setRoleMessage = (a:string) => this.roleMessage = a;

    getWinBuddies = () => this.winBuddies
    clearwinBuddies = () => this.winBuddies = [];
    setWinBuddies = (a:string[]) => this.winBuddies = a;
    pushFriendly = (a:string) => this.winBuddies.push(a);

    getImmunities = () => this.immunities
    pushImmunity = (a:string) => this.immunities.push(a);


    getNightMessage = () => this.nightMessage
    setNightMessage = (a:string) => this.nightMessage = a;

    getCommands = () => this.commands
    pushCommand = (a:Command) => this.commands.push(a);

}
