import Command from "./command"
import Game from "./game"
import Notif from "./notif"
import Player from "./player"

export interface AnotherCommand{
    name: string;
    type: string;
    cast: string;
    guide: string;
    description: string;
    priority: number;
    stocks: number;
    authorization: string;
    queue: string;
    phase: string[];
    requiredStatus: string[];
    targetCount: number;
    lethal: boolean;
    run: runFunc;
    performer: performerFunc;
    defaultTarget: defaultTargetFunc;
    visitsTarget: visitsTargetFunc;
    targetables: targetables;
    callResponse:  callResponseFunc;
}

export type performerFunc = (a: gameAndPlayer) => Player
export type targetables =  (a: gameAndPlayer) => Player[]
export type visitsTargetFunc =  (a: gameAndPlayer) => boolean
export type defaultTargetFunc = (a: gameAndPlayer) => Player[]

export type runFunc =  (a: actionParams) => void
export type callResponseFunc = (a: actionParams) => Promise < string | void >

export interface gameAndPlayer{
    game: Game
    user: Player
}

export interface actionParams {
    game: Game
    user: Player
    performer: Player
    command: Command
    targetOne: Player
    targetTwo: Player
    args: string[]
}

export interface AnotherRole{
    id: string;
    name: string;
    alignment: string;
    type: string;
    immunities: string[];
    attack: number;
    defense: number;
    unique: boolean;
    abilities: string[];
    goals: string[];
    nightMessage: string;
    roleMessage: string;
    winBuddies: string[];
    commands: AnotherCommand[];
}

const roles: AnotherRole[] =  [
    {
        id:'001',
        name:'Ghost',
        alignment:'Evil',
        type:'Killing',
        immunities:[],
        attack:1,
        defense:0,
        unique:true,
        abilities:[
            'You can stalk (1) student each night.',
            'You can kill (1) student if certain conditions are met.'
        ],
        goals:[
            'Lynch an innocent student.',
            'Or kill all students.'
        ],
        nightMessage:'You can talk to the detained person.',
        roleMessage:'',
        winBuddies:[],
        commands:[
            {   
                name:'stalk',
                type:'Role Command',
                cast:'Normal',
                guide:'stalk <player>',
                description:'Stalks a person for one night.',
                priority:1,
                stocks:99,
                authorization:'Role Holder',
                queue:'Normal',
                phase:['Night', 'Night (Full Moon)'],
                requiredStatus:['Alive'],
                targetCount:1,
                lethal: false,
                performer:({ user }) => user,
                visitsTarget:() => true,
                defaultTarget:({ user }) => [user],
                targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                callResponse: async({targetOne: target})=>{
                    return `You have decided to stalk **${target.getUsername()}** tonight.`
                },
                run:() => {},
            },
            {
                name:'kill',
                type:'Role Command',
                cast:'Normal',
                guide:'kill <player>',
                description:'Kills the target.',
                priority:1,
                stocks:99,
                authorization:'Role Holder',
                queue:'Normal',
                phase:['Night', 'Night (Full Moon)'],
                requiredStatus:['Alive'],
                targetCount:1,
                lethal: false,
                performer:({ user }) => user,
                visitsTarget:() => true,
                defaultTarget:({ user }) => [user],
                targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                callResponse: async ({targetOne: target}) => `You have decided to kill **${target.getUsername()}** tonight.`,
                run:({targetOne: target})=>{
                    target.kill();
                    if(target.getCauseOfDeath().length===0){
                        target.pushCauseOfDeath(`${target.getUsername()} died to an accident.`);
                    }else{
                        target.pushCauseOfDeath(`${target.getUsername()} also died to an accident.`);
                    }
                    target.pushNotif(new Notif({ inbox: 'You have been killed by the Ghost!' }));
                },
            },
        ],
    },
    {
        id:'002',
        name:'Student',
        type:'Normal',
        alignment:'Good',
        immunities:[],
        attack:0,
        defense:0,
        unique:false,
        abilities:[
            "You can check (1) person's house at night."
        ],
        goals:[
            'Find and lynch the ghost.'
        ],
        nightMessage:'You can use your ability now.',
        roleMessage:'Pick (1) people to check.',
        winBuddies:[],
        commands:[
            {
                name:'check',
                type:'Role Command',
                cast:'Normal',
                guide:'check <student>',
                description:"Checks the student's house.",
                priority:1,
                stocks:99,
                authorization:'Role Holder',
                queue:'Normal',
                phase:['Night', 'Night (Full Moon)'],
                requiredStatus:['Alive'],
                targetCount:2,
                lethal: false,
                performer:({ user }) => user,
                visitsTarget:() => true,
                defaultTarget:({ user }) => [user],
                targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                callResponse: async ({targetOne: target}) => {
                    return `You have decided to check **${target.getUsername()}**'s house.`
                },
                run:() => {},
            },
        ],
    },
            
];

export default roles;