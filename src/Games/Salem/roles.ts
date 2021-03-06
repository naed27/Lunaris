import Role from './role';
import Player from './player';
import { arrayContainsElement, shuffleArray, stringifyArrayOfNames } from '../../Helpers/toolbox';
import Game from './game';
import Notif from './notif';
import Command from './command';
import { PhasePossibilities } from './phases';

export type RolePoolElement = { 
	id: string,
	alignment: SalemRoleAlignment | 'Random', 
	type: SalemRoleType | 'Random', 
	name: SalemRoleName | 'Random',
} 

export type SalemRoleName = 
	| 'Jailor'
	| 'Transporter'
	| 'Jester' 
	| 'Medium'
	| 'Veteran'
	| 'Retributionist'
	| 'Witch'
	| 'Escort'
	| 'Consort'
	| 'Survivor'
	| 'Forger'
	| 'Framer'
	| 'Arsonist'
	| 'Blackmailer'
	| 'Bodyguard'
	| 'Doctor'
	| 'Janitor'
	| 'Investigator'
	| 'Consigliere'
	| 'Sheriff'
	| 'Lookout'
	| 'Spy'
	| 'Disguiser'
	| 'Godfather'
	| 'Vampire'
	| 'Mafioso'
	| 'Vigilante'
	| 'Serial Killer'
	| 'Werewolf'
	| 'Arsonist'
	| 'Executioner'

export type SalemRoleAlignment = 
	| 'Mafia'
	| 'Town'
	| 'Neutral'

export type SalemRoleType = 
	| 'Killing'
	| 'Investigative'
	| 'Support'
	| 'Evil'
	| 'Leader'
	| 'Chaos'
	| 'Protective'
	| 'Benign'

export type RoleType = 
	| 'Admin Command' 
	| 'Host Command' 
	| 'Skill Command' 
	| 'Universal Command' 
	| 'Action Command'

export type Queue = 'Normal' | 'Instant'


export interface SalemCommand{
	name: string;
	guide: string;
	description: string;
	priority: number;
	stocks: number;
	type: RoleType;
	queue: Queue;
	phase: PhasePossibilities[];
	requiredStatus: string[];
	targetCount: number;
	lethal: boolean;
	hasMenu: boolean;
	hasArguments: boolean;
	inputSeparator: string;
	run: runFunc;
	performer: performerFunc;
	defaultTarget: defaultTargetFunc;
	visitsTarget: visitsTargetFunc;
	targetables: targetablesFunc;
	callResponse: callResponseFunc;
}

export type performerFunc = (a:{ game: Game, user: Player }) => Player
export type visitsTargetFunc =  (a: { game: Game, performer: Player }) => boolean
export type targetablesFunc =  (a: { game: Game, user: Player }) => Player[]
export type defaultTargetFunc = (a: { game: Game, user: Player }) => Player[]
export type WinListener = (a: { game: Game, user: Player }) => boolean

export type runFunc =  (a: actionParams) => (any | Promise<any>)
export type callResponseFunc = (a: actionParams) => Promise< string | void >

export interface actionParams {
	game: Game
	user: Player
	args: string[]
	command: Command
	performer: Player
	firstTarget: Player | 'None'
	secondTarget: Player | 'None'
}

export interface Results{
	sheriff: string
	consigliere: string
	investigator: string
}

export interface SalemRole{
	id: string;
	name: SalemRoleName;
	alignment: SalemRoleAlignment;
	type: SalemRoleType;
	immunities: string[];
	attack: number;
	defense: number;
	unique: boolean;
	results: Results;
	abilities: string[];
	goals: string[];
	nightMessage: string;
	roleMessage: string;
	winBuddies: string[];
	winListener: WinListener;
	commands: SalemCommand[];
}


const roles: SalemRole[] = [
	{
		id:`001`,
		name:`Jailor`,
		alignment:`Town`,
		type:`Killing`,
		immunities:[],
		attack:3,
		defense:0,
		unique:true,
		results:{
			investigator:`Your target could be a Spy, Blackmailer, or Jailor.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be the Jailor.`
		},
		abilities:[
			`You can jail 1 Person each night.`,
			`You can talk to the jailed person.`
		],
		goals:[ `Lynch/kill all of the evildoers.` ],
		nightMessage:`You can talk to the detained person.`,
		roleMessage:``,
		winBuddies:[ `game`, `Survivor`, `Amnesiac`, `Jester`, `Executioner` ],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{   
				name:`jail`,
				guide:`jail <player>`,
				description:`Jails a person for one night.`,
				priority:1,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				phase:[`Discussion`, `Voting`, `Judgement`, `Defense`, `Final Words`, `Execution`],
				requiredStatus:[`Alive`],
				targetCount:1,
				lethal: false,
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer: ({ user }) => user,
				visitsTarget: () => false,
				targetables: ({user,game}) => game.getPlayers().filter(p=>p.getId()!=user.getId() && p.isAlive()),
				defaultTarget:() => [],
				callResponse: async ({ firstTarget }) => `You have decided to jail ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`,
				run: ({ user, firstTarget, game })=>{
					const target = firstTarget;
					if(target === 'None') return game.removeActionOf(user);
					target.setJailStatus(true);
					target.pushNotif(new Notif({ 
						inbox: `You have been hauled off to jail!\nYou are now alone with the jailor.` 
					}));
					const executeCommand = user.getRole().getCommands().find(c=>c.getName()==`execute`);
					executeCommand.setStocks(1);
				},
			},
			{
				name:`execute`,
				guide:`execute`,
				description:`Executes the currently jailed person.`,
				priority:1,
				stocks:0,
				type:`Skill Command`,
				queue:`Normal`,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				targetCount:0,
				lethal: false,
				hasMenu: false,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:() => null,
				defaultTarget:({ game })=> game.getJailedPerson() ? [game.getJailedPerson()] : null,
				callResponse: async ({ user, firstTarget })=>{
					firstTarget !== 'None' && firstTarget.sendMarkDownToChannel(`The jailor has decided to execute you.`);
					user.sendMarkDownToChannel(`You have decided to execute ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`)
				},
				run:({ command, firstTarget, game, user })=>{
					command.decrementStock();
					
					const target = firstTarget;
					if(target === 'None') return game.removeActionOf(user);
					target.kill();
					target.pushCauseOfDeath(`executed by the Jailor.`);
					target.pushNotif(new Notif({
						newsForSpy: `Your target was in jail.`,
						inbox: `You have been executed by the Jailor!`
					}));
				},
			},
		],
	},
	{
		id:`013`,
		name:`Transporter`,
		alignment:`Town`,
		type:`Support`,
		immunities:[`Roleblock`,`Control`],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Escort, Transporter, or Consort.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Transporter.`
		},
		abilities:[
			`You can swap 2 people's places each night.`
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick (2) people to swap.`,
		winBuddies:[`game`,`Survivor`,`Amnesiac`,`Jester`,`Executioner`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`transport`,
				guide:`transport <player 1>, <player 2>`,
				description:`Swaps the two targets of their locations.`,
				priority:1,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:2,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game }) => game.getAlivePlayers(),
				defaultTarget:() => [],
				callResponse:async ({firstTarget, secondTarget}) =>
					`You have decided to swap ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()} with ${secondTarget === 'None' ? 'no one' : secondTarget.getUsername()}.`
				,
				run:({ firstTarget, secondTarget, game, user})=>{
					if(firstTarget === 'None' || secondTarget === 'None') return game.removeActionOf(user)
					game.getActions()
					.filter( a => a.getCommand().getName() !== `transport`)
					.map( a => {
						const firstActionTarget = a.getFirstTarget();
            if(firstActionTarget === 'None') return false
						firstActionTarget.getId() === firstTarget.getId() ? 
						a.setFirstTarget(secondTarget) : 
						a.setFirstTarget(firstTarget)
					});

					const notif = new Notif({
						inbox: `You have been transported!`,
						newsForSpy: `Your target was transported!`
					})

					firstTarget.pushNotif(notif);
					secondTarget.pushNotif(notif);
				},
			},
		],
	},
	{
		id:`005`,
		name:`Veteran`,
		alignment:`Town`,
		type:`Killing`,
		immunities:[`Roleblock`,`Control`],
		attack:2,
		defense:0,
		unique:true,
		results:{
			investigator:`Your target could be a Vigilante, Veteran, or Mafioso.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Veteran.`
		},
		abilities:[
			`You can kill people who visit you. (3 uses)`,
		],
		goals:[
			`Lynch/kill all of the evildoers.`
		],
		nightMessage:`Choose whether to alert or not.`,
		roleMessage:`Click [o] to alert, [x] to cancel.`,
		winBuddies:[`game`,`Survivor`,`Amnesiac`,`Jester`,`Executioner`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`alert`,
				guide:`alert`,
				description:`Kills anyone who visits you at night.`,
				priority:1,
				stocks:4,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:0,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: false,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:() => null,
				defaultTarget:({ user }) => [user],
				callResponse:async ()=>{
					return `You have decided to stay on alert for tonight.`
				},
				run:({user, command})=>{
					command.decrementStock()
					user.pushBuff(`Alert`);
				},
			},
		],
	},
	{
		id:`206`,
		name:`Witch`,
		alignment:`Neutral`,
		type:`Evil`,
		immunities:[`Roleblock`,`Control`],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Lookout, Forger, or Witch.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be an Witch.`
		},
		abilities:[
			`You can control 1 person each night.`
		],
		goals:[
			`Survive with Mafia/Arsonist/Werewolf/Serial Killer.`
		],
		nightMessage:`You can use your ability now`,
		roleMessage:`Pick who to bewitch.`,
		winBuddies:[`Witch`],
		winListener: () => {
				return false
		},
		commands:[
			{
				name:`witch`,
				guide:`witch <player 1>, <player 2>`,
				description:`Controls <player 1> into targeting <player 2>.`,
				priority:2,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:2,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game, user }) => game.getPlayers().filter(p => p.isAlive() && p.getId() !== user.getId()),
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to control ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()} into targeting ${{firstTarget}[1].getUsername()}.`
				},
				run:({ user, game, firstTarget, secondTarget })=>{
					if(firstTarget === 'None' || secondTarget === 'None') return game.removeActionOf(user)

					const firstTarget_action = game.getActionOf(firstTarget);

					if(firstTarget.isImmuneTo('Control'))
						return firstTarget.pushNotif(new Notif({
							inbox: `Someone tried to control you, but you were immune.`,
							newsForSpy: `Your target was witched!`
						}));

					if(firstTarget_action.getCommand().getTargetCount()==1){
						firstTarget_action.setFirstTarget(secondTarget);
						firstTarget_action.setSecondTarget('None');
					}
					firstTarget.pushNotif(new Notif({
						inbox: `Someone is controlling you..\nYou have been witched!`,
						newsForSpy: `Your target was witched!`
					}));
				},
			},
		],
	},
	{
		id:`008`,
		name:`Escort`,
		alignment:`Town`,
		type:`Support`,
		immunities:[`Roleblock`],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Escort, Transporter, or Consort.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Lookout.`
		},
		abilities:[
			`You can distract someone each night.`,
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick someone to roleblock. (letter)`,
		winBuddies:[`game`,`Survivor`,`Amnesiac`,`Jester`,`Executioner`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`distract`,
				guide:`distract <player>`,
				description:`Prevents a person from using their role ability.`,
				priority:2,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					return game.getAlivePlayers().filter(p=>p.getId()!=user.getId() && p.alignmentIsNot('Mafia'))
				},
				defaultTarget:({})=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to distract ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()} tonight.`
				},
				run:({firstTarget: target, game, user})=>{
					if(target === 'None') return game.removeActionOf(user)
					const immunities = target.getRole().getImmunities();
					if(!arrayContainsElement(immunities,`Roleblock`)){
						target.setRoleBlockStatus(true);
						target.pushNotif(new Notif({
							inbox: `Someone distracted you last night!`,
							newsForSpy: `Your target was distracted by someone!`
						}));
					}else{
						target.pushNotif(new Notif({
							inbox: `Someone tried to distract you last night, but you were immune.`,
							newsForSpy: `Your target was distracted by someone!`
						}));
					}
				},
			},
		],
	},
	{
		id:`110`,
		name:`Consort`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[`Roleblock`],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Escort, Transporter, or Consort.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Consort.`
		},
		abilities:[
			`You can distract someone each night.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to roleblock. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Jester`,`Executioner`,`Amnesiac`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`distract`,
				guide:`distract <player>`,
				description:`Prevents a person from using their role ability.`,
				priority:2,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>
					game.getPlayers().filter( p =>
						p.isAlive() &&
						p.getId()!=user.getId() &&
						p.getRole().getAlignment()!=`Mafia`
					)
				,
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					const message = `${user.getUsername()} has decided to distract ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(message);
					return `You have decided to distract ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()} tonight.`
				},
				run:({firstTarget: target, game, user})=>{
					if(target === 'None') return game.removeActionOf(user)
					const immunities = target.getRole().getImmunities();
					if(!arrayContainsElement(immunities,`Roleblock`)){
						target.setRoleBlockStatus(true);
						target.pushNotif(new Notif({
							inbox: `Someone distracted you last night!`,
							newsForSpy: `Your target was distracted by someone!`
						}));
					}else{
						target.pushNotif(new Notif({
							inbox: `Someone tried to distract you last night, but you were immune.`,
							newsForSpy: `Your target was distracted by someone!`
						}));
					}
				},
			},
		],
	},
	{
		id:`202`,
		name:`Survivor`,
		alignment:`Neutral`,
		type:`Benign`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Survivor, Vampire Hunter, or Amnesiac.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be an Survivor.`
		},
		abilities:[
			`You can win with any Alignment.`
		],
		goals:[
			`Survive until the end.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Choose whether to use your shield. (letter)`,
		winBuddies:[`Survivor`],
		winListener: () => {
			return false;
		},
		commands:[
			{
				name:`vest`,
				guide:`vest`,
				description:`Be immune to any attacks at night.`,
				priority:3,
				stocks:4,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:0,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: false,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:() => null,
				defaultTarget:({ user } ) => [user],
				callResponse: async () => `You have decided to wear a vest tonight.`,
				run:({command, firstTarget, game, user})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					command.decrementStock();
					if(firstTarget.getRole().getName()==`Survivor`)
						firstTarget.pushBuff(`Vest`)
				},
			},
		],
	},
	// {
	//     id:`201`,
	//     name:`Amnesiac`,
	//     alignment:`Neutral`,
	//     type:`Benign`,
	//     immunities:[],
	//     attack:0,
	//     defense:0,
	//     unique:false,
	//     results:{
	//         investigator:`Your target could be a Survivor, Vampire Hunter, or Amnesiac.`,
	//         sheriff:`Your target seems innocent.`,
	//         consigliere:`Your target seems to be an Amnesiac.`
	//     },
	//     abilities:[
	//         `You can select any roles in the graveyard.`
	//     ],
	//     goals:[
	//         `Remember who you are.`
	//     ],
	//     nightMessage:`You can use your ability now.`,
	//     roleMessage:`Pick a persona to remember yourself as. (letter)`,
	//     winBuddies:[],
	//     commands:[
	//         {
	//             name:`remember`,
	//             guide:`remember <player>`,
	//             description:`Copy a role from someone who is dead.`,
	//             priority:6,
	//             stocks:1,
	//             permission:`Role Holder`,
	//             queue:`Normal`,
	//             requiredTargets:1,
	//             phase:[`Night`],
	//             status:`Alive`,
	//             hasMenu: true,
							// hasArguments: false,
							// inputSeparator: ',',
							// performer:(user,command,game)=>{
	//                 return user;
	//             },
	//             visitsTarget:({user, game})=>{
	//                 return false;
	//             },
	//             targetables:({user, game})=>{
	//                 let targetables = game.getPlayers().filter(p=>p.getStatus()==`Dead` && p.getId()!=user.getId());
	//                 return targetables;
	//             },
	//             callResponse:async (user,command,{firstTarget},game)=>{
	//                 return `You have decided to attempt remembering your past.`
	//             },
	//             run:(user,performer,command,{ game, firstTarget, secondTarget })=>{
	//                 let n1 = {
	//                     player:null,
	//                     spy:null
	//                 }
	//                 command.setStocks(command.setStocks(0));
	//                 let target = targets[0];
	//                 if(target.getStatus()==`Dead` && target.getMaskRole().getName()!=`Cleaned` && target.getMaskRole().getUnique()!=true){
	//                     let past = module.exports.list.filter(r=>r.Name==target.getRole().getName());
	//                     user.setRole(new Role(past));
	//                     n1.player=`You remembered that you are a ${user.getMaskRole().getName()}!`;
	//                 }else{
	//                     n1.player=`You failed to remember who you are...`;
											
	//                 }
	//                 performer.pushNotif(n1);
	//             },
	//         },
	//     ],
	// },
	{
		id:`002`,
		name:`Retributionist`,
		alignment:`Town`,
		type:`Support`,
		immunities:[`Roleblock`],
		attack:0,
		defense:0,
		unique:true,
		results:{
			investigator:`Your target could be a Medium, Janitor, or Retributionist.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Retributionist.`
		},
		abilities:[
			`You can resurrect 1 dead person. (One time use)`
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can resurrect someone now.`,
		roleMessage:`Pick who to resurrect. (letter)`,
		winBuddies:[`game`,`Survivor`,`Jester`,`Executioner`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`resurrect`,
				guide:`resurrect <player>`,
				description:`Resurrects the target from the dead.`,
				priority:1,
				stocks:1,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isDead() && p.getMaskRole().getName() != `Cleaned`);
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to resurrect ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({ game, firstTarget, command, user})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					command.decrementStock()
					firstTarget.resurrect();
					game.pushFreshReborn(firstTarget);
				},
			},
		],
	},
	{
		id:`104`,
		name:`Framer`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Framer, Vampire, or Jester.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Framer.`
		},
		abilities:[
			`You can frame 1 person each night.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to frame. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`frame`,
				guide:`frame <player>`,
				description:`Frames a person at night.`,
				priority:3,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game }) => game.getPlayers().filter(p => p.isAlive() && p.getRole().getAlignment() != `Mafia`),
				defaultTarget:() => [],
				callResponse:async ({user, firstTarget})=>{
					const msg = `${user.getUsername()} has decided to frame ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(msg);
					return `You have decided to frame ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({firstTarget: target, game, user})=>{
					if(target === 'None') return game.removeActionOf(user)
					const role = roles.find(r=>r.name==`Mafioso`);
					target.setMaskRole(new Role(role));
				},
			},
		],
	},
	{
		id:`106`,
		name:`Disguiser`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:['Control'],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Doctor, Disguiser, or Serial Killer.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Disguiser.`
		},
		abilities:[
			`You can disguise a person with another's to alter their identity.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick (2) people to swap identity. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`disguise`,
				guide:`disguise <player>`,
				description:`Steals the target's identity.`,
				priority:5,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:2,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					const msg = `${user.getUsername()} has decided to disguise themself as ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(msg);
					return `You have decided to disguise yourself as ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({ game, firstTarget, user, performer})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					const oldDisguisedPlayer = game.getPlayers().find(p=>p.isDisguised());
					if(oldDisguisedPlayer){
						oldDisguisedPlayer.setDisguiseStatus(false);
						oldDisguisedPlayer.resetMask();
					}
					
					const mask = roles.find(r=>r.name==firstTarget.getRole().getName());

					performer.setMaskRole(new Role(mask));
					performer.setDisguiseStatus(true);
					performer.setMaskName(firstTarget.getUsername());
				},
			},
		],
	},
	{
		id:`109`,
		name:`Consigliere`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Investigator, Consigliere, or Mayor.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Consigliere.`
		},
		abilities:[
			`You can check one person for their exact role each night.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to investigate. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`tail`,
				guide:`tail <player>`,
				description:`Gives you the exact role of a person.`,
				priority:4,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game }) => game.getNonMafias().filter(p => p.isAlive()),
				defaultTarget:() => [],
				callResponse:async ({ user, firstTarget })=>{
					const message = `${user.getUsername()} has decided to investigate ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(message);
					return `You have decided to investigate ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user, firstTarget, game, performer})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					performer.pushNotif(new Notif({
						inbox: firstTarget.getRole().getResults().getConsigliere(),
					}));
				},
			},
		],
	},
	{
		id:`006`,
		name:`Investigator`,
		alignment:`Town`,
		type:`Investigative`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
				investigator:`Your target could be a Investigator, Consigliere, or Mayor.`,
				sheriff:`Your target seems innocent.`,
				consigliere:`Your target seems to be an Investigator.`
		},
		abilities:[
				`You can find clues about a person's role each night.`,
		],
		goals:[
				`Lynch/kill all of the evildoers`
		],
		nightMessage:`You can investigate someone now.`,
		roleMessage:`Pick who to investigate. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
				const aliveEvil: Player[] = [];
				const aliveTown: Player[] = [];
				game.getAlivePlayers().map(p => {
						p.role.alignment === 'Town' && aliveTown.push(p)
						if(p.role.alignment === 'Mafia' || 
						p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
				});
				if(aliveEvil.length === 0 && aliveTown.length>0)
						return true
				return false;
		},
		commands:[
			{
				name:`tail`,
				guide:`tail <player>`,
				description:`Gives you clues about the target's role.`,
				priority:4,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getId() != user.getId());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to investigate ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user, firstTarget, game, performer})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					performer.pushNotif(new Notif({
						inbox: firstTarget.getMaskRole().getResults().getInvestigator(),
					}));
				},
			},
		],
	},
	{
		id:`003`,
		name:`Sheriff`,
		alignment:`Town`,
		type:`Investigative`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Sheriff, Executioner, or Werewolf..`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Sheriff.`
		},
		abilities:[
			`You can check 1 person at night for suspicious activities.`,
		],
		goals:[
			`Lynch/kill all of the evildoers`
		],
		nightMessage:`You can interrogate someone now.`,
		roleMessage:`Pick who to interrogate. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`visit`,
				guide:`visit <player>`,
				description:`Lets you know whether someone is suspicious or not.`,
				priority:4,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getId() != user.getId());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to interrogate ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user, firstTarget, game, performer})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					performer.pushNotif(new Notif({
						inbox: firstTarget.getMaskRole().getResults().getSheriff()
					}));
				},
			},
		],
	},
	{
		id:`108`,
		name:`Blackmailer`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Spy, Blackmailer, or Jailor.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Blackmailer.`
		},
		abilities:[
			`You can blackmail 1 person each night.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to blackmail. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`blackmail`,
				guide:`blackmail <player>`,
				description:`Prevent a person from talking during the day.`,
				priority:3,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getRole().getAlignment() != `Mafia`);
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					const msg = `${user.getUsername()} has decided to blackmail ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(msg);
					return `You have decided to blackmail ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({firstTarget, game, user})=>{
					if(firstTarget === 'None') return game.removeActionOf(user)
					let target = firstTarget
					target.setMuteStatus(true);
					target.pushNotif(new Notif({
							inbox: `You have been blackmailed!`,
							newsForSpy: `Your target was blackmailed!`
					}));
				},
			},
		],
	},
	{
		id:`0087`,
		name:`Lookout`,
		alignment:`Town`,
		type:`Investigative`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Lookout, Forger, or Witch.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Lookout.`
		},
		abilities:[
			`You can watch 1 person at night to see who visits them.`,
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can stakeout someone now.`,
		roleMessage:`Pick a house to set a stakeout. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`watch`,
				guide:`watch <player>`,
				description:`Lets you know who visits your target.`,
				priority:4,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to keep an eye on ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}'s house tonight.`
				},
				run:({user, firstTarget: target, game, performer})=>{
					if(target === 'None') return game.removeActionOf(user)
					
					const actions = game.getActions().filter(a=>{
						const firstActionTarget = a.getFirstTarget();
						if(firstActionTarget === 'None') return false;
						firstActionTarget.getId()==target.getId()
					});
					
					const visitors = actions.map(a => {
						if(a.getCommand().visitsTarget({ performer: a.getUser(), game: game })){
							return a.getPerformer().getMaskName();
						}
					});

					const stringOfVisitors = stringifyArrayOfNames(shuffleArray(visitors));

					performer.pushNotif(new Notif({ inbox: `${stringOfVisitors} visited your target.` }));
				},
			},
		],
	},
	{
		id:`101`,
		name:`Godfather`,
		alignment:`Mafia`,
		type:`Leader`,
		immunities:[],
		attack:1,
		defense:1,
		unique:true,
		results:{
				investigator:`Your target could be a Bodyguard, Godfather, or Arsonist.`,
				sheriff:`Your target is suspicious!`,
				consigliere:`Your target seems to be the Godfather.`
		},
		abilities:[
				`You can order to kill 1 gameie each night.`
		],
		goals:[
				`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to kill. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
				const aliveEnemies: Player[] = [];
				const aliveMafia: Player[] = [];
				game.getAlivePlayers().map(p => {
						if( p.role.alignment === 'Neutral' && 
								p.role.type !== 'Benign' && 
								p.role.type !== 'Evil' || 
								p.role.alignment === 'Town') 
								aliveEnemies.push(p)
						if(p.role.alignment === 'Mafia')
								aliveMafia.push(p);
				})
				if(aliveEnemies.length === 0 && aliveMafia.length > 0)
						return true
				return false;
		},
		commands:[
			{
				name:`kill`,
				guide:`kill <player>`,
				description:`Orders the mafioso to kill your target.`,
				priority:5,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: true,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({user, game})=>{
					if(game.roleExists(`Mafioso`))
						return game.getPlayers().find(p=>p.getRole().getName()==`Mafioso`)
					return user
				},
				visitsTarget:({ game })=>{
					if(game.roleExists(`Mafioso`))
						return false;
					return true;
			},
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getRole().getAlignment() != `Mafia`);
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					if(game.roleExists(`Mafioso`)){
						const msg = `${user.getUsername()} has ordered the mafioso to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
						await user.messageOtherMafias(msg);
						return `You have ordered the Mafioso to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					}else{
						const msg = `${user.getUsername()} has decided to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
						await user.messageOtherMafias(msg);
						return `You have decided to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					}
				},
				run:({user,firstTarget: target, game, performer})=>{
					if(target=== 'None') return game.removeActionOf(user)
					const targetNotif = new Notif({
						inbox: `You were attacked by the mafia!`,
						newsForSpy: `Your target was attacked by the mafia!`
					})
					const killerNotif = new Notif({});
					
					if(target.getBuffs().length===1) 
						return target.calculateBuff({
							killer: performer,
							targetNotif: targetNotif,
							killerNotif: killerNotif
						})

					if(target.getRole().getDefense() < performer.getRole().getAttack()){
						target.kill();
						target.pushCauseOfDeath(`attacked by a member of the Mafia.`);
					}else{
						targetNotif.setInbox(`Someone attacked you last night but you were immune!`);
						killerNotif.setInbox(`Your target's defense was too strong! You failed to kill your target.`);
						performer.pushNotif(killerNotif);
					}
					target.pushNotif(targetNotif);
				},
			},
		],
	},
	// {
	//     id:`203`,
	//     name:`Vampire`,
	//     alignment:`Neutral`,
	//     type:`Chaos`,
	//     immunities:[],
	//     attack:1,
	//     defense:0,
	//     unique:false,
	//     results:{
	//         investigator:`Your target could be a Framer, Vampire, or Jester.`,
	//         sheriff:`Your target is suspicious!`,
	//         consigliere:`Your target seems to be an Vampire.`
	//     },
	//     abilities:[
	//         `You can convert 1 person into a vampire each night.`
	//     ],
	//     goals:[
	//         `Make the vampires the last ones to survive.`
	//     ],
	//     nightMessage:`You can use your ability now.`,
	//     roleMessage:`Pick who to bite. (letter)`,
	//     winBuddies:[`Vampire`,`Witch`,`Survivor`,`Executioner`,`Jester`],
	//     commands:[
	//         {
	//             name:`bite`,
	//             guide:`bite <player>`,
	//             description:`Turns the target into a vampire.`,
	//             priority:5,
	//             stocks:99,
	//             permission:`Role Holder`,
	//             queue:`Normal`,
	//             requiredTargets:1,
	//             phase:[`Night`],
	//             status:`Alive`,
	//             hasMenu: true,
	//             hasArguments: false,
							// inputSeparator: ',',
	//             performer:(user,command,game)=>{
	//                 return user;
	//             },
	//             visitsTarget:({user, game})=>{
	//                 return true;
	//             },
	//             targetables:({user, game})=>{
	//                 let targetables = game.getPlayers().filter(p => p.isAlive() && p.getRole().getName() != `Vampire`);
	//                 return targetables;
	//             },
	//             callResponse:async (user,command,{firstTarget},game)=>{
	//                 return `You have decided to bite ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
	//             },
	//             run:(user,performer,command,{ game, firstTarget, secondTarget })=>{
	//                 let n1 = {
	//                     player: null,
	//                     spy: `Your target was bitten by a vampire!`
	//                 }
	//                 let n2 = {
	//                     player: null,
	//                     spy: null
	//                 }
	//                 let target = targets[0];
	//                 let targetBuffs = target.getRole().getBuffs();
	//                 if(target.getRole().getDefense()==0){
	//                     if(targetBuffs.length==0){
	//                         if(target.getRole().getAlignment()!=`Mafia`){
	//                             if(target.getRole().getName()!=`Vampire`){
	//                                 let vamp = module.exports.list.filter(r=>r.Name==`Vampire`);
	//                                 target.setRole(new Role(vamp));
	//                                 let n1 = {
	//                                 player: `You were bitten by a vampire! You are now a servant of evil!`,
	//                                 spy: `Your target was bitten by a vampire!`
	//                                 }
	//                                 target.pushNotif(n1);
	//                             }
	//                         }else{
	//                             target.kill();
	//                             target.pushCauseOfDeath(`forced to commit suicide.`);
	//                             n1.player= `You were bitten by a vampire!\nYour loyalty to the mafia made you kill yourself!`
	//                             target.pushNotif(n1);
	//                         }
	//                     }else{
	//                         target.calcBuff(target,performer,n1,n2)
	//                     }
	//                 }else{
	//                     n1.player=`A vampire tried to bite you but you were immune.`;
	//                     target.pushNotif(n1);
	//                     n2.player=`Your target's defense was too strong!`;
	//                     performer.pushNotif(n2);
	//                 }
	//             },
	//         },
	//     ],
	// },
	{
		id:`107`,
		name:`Mafioso`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[],
		attack:1,
		defense:0,
		unique:true,
		results:{
			investigator:`Your target could be a Vigilante, Veteran, Mafioso.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Mafioso.`
		},
		abilities:[
			`You carry out the Godfather's orders.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to kill. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`kill`,
				guide:`kill <player>`,
				description:`kills the target.`,
				priority:5,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getRole().getAlignment() != `Mafia`); 
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					let msg ='';
					if(game.roleExists(`Godfather`)){
						msg = `${user.getUsername()} has voted to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
						await user.messageOtherMafias(msg);
						return `You have voted to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					}else{
						msg = `${user.getUsername()} has decided to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
						await user.messageOtherMafias(msg);
						return `You have decided to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					}
				},
				run:({ game, firstTarget: target, user, performer})=>{
					if(target === 'None') return game.removeActionOf(user);

					const godfatherAction = game.getActions()
						.find(a => a.getUser().getRoleName() === 'Godfather');
					
					if(godfatherAction)return
					
					const targetNotif = new Notif({ newsForSpy: `Your target was attacked by the mafia!` })
					const killerNotif = new Notif({})
					if(target.getBuffs().length===1) 
						return target.calculateBuff({
							killer: performer,
							targetNotif: targetNotif,
							killerNotif: killerNotif
						});
					if(target.getRole().getDefense()<performer.getRole().getAttack()){
						target.kill();
						target.pushCauseOfDeath(`attacked by a member of the Mafia.`);
						targetNotif.setInbox(`You were attacked by the mafia!`);
					}else{
						targetNotif.setInbox(`Someone attacked you last night but you were immune!`);
						killerNotif.setInbox(`Your target's defense was too strong! You failed to kill your target.`)
						performer.pushNotif(killerNotif);
					}
					target.pushNotif(targetNotif);
				},
			},
		],
	},
	{
		id:`004`,
		name:`Vigilante`,
		alignment:`Town`,
		type:`Killing`,
		immunities:[],
		attack:1,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Vigilante, Veteran, or Mafioso.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Vigilante.`
		},
		abilities:[
			`You can take justice into your own hands and shoot someone each night.`,
		],
		goals:[
			`Lynch/kill all of the evildoers`
		],
		nightMessage:`You can take a shot or pass.`,
		roleMessage:`Pick who to shoot. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`shoot`,
				guide:`shoot <player>`,
				description:`Kills the target.`,
				priority:5,
				stocks:3,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: true,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to shoot ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user,command,firstTarget: target, game, performer})=>{
					if(target === 'None') return game.removeActionOf(user);
					command.setStocks(command.getStocks()-1);
					const targetNotif = new Notif({ newsForSpy: `Your target was attacked by a Vigilante!` })
					const killerNotif = new Notif({});
					if(target.getBuffs().length==0) 
						return target.calculateBuff({
							killer: performer,
							targetNotif: targetNotif,
							killerNotif: killerNotif
						});

					if(target.getRole().getDefense()<performer.getRole().getAttack()){
						target.kill();
						target.pushCauseOfDeath(`shot by a Vigilante.`);
						targetNotif.setInbox(`You were shot by a Vigilante!`);  
					}else{
						targetNotif.setInbox(`Someone attacked you last night but you were immune!`);
						killerNotif.setInbox(`Your target's defense was too strong! You failed to kill your target.`),
						performer.pushNotif(killerNotif);
					}
					target.pushNotif(targetNotif);
				},
			},
		],
	},
	{
		id:`208`,
		name:`Serial Killer`,
		alignment:`Neutral`,
		type:`Killing`,
		immunities:[],
		attack:1,
		defense:1,
		unique:false,
		results:{
			investigator:`Your target could be a Doctor, Disguiser, or Serial Killer.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Serial Killer.`
		},
		abilities:[
			`You can kill 1 person each night.`,
			`You are immune to night attacks.`
		],
		goals:[
			`Be the last person alive.`
		],
		nightMessage:`You can use your ability now`,
		roleMessage:`Pick who to kill.`,
		winBuddies:[`Serial Killer`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveFriends: Player[] = [];
			const aliveEnemies: Player[] = [];
			const aliveSerialKillers: Player[] = [];
			game.getAlivePlayers().map(p => {
				if(p.role.name === 'Serial Killer') return aliveSerialKillers.push(p);
				if( p.role.alignment === 'Neutral' && p.role.type === 'Evil' ||
					p.role.alignment === 'Neutral' && p.role.type === 'Benign')
					return aliveFriends.push(p);
				return aliveEnemies.push(p);
			})
			if(aliveEnemies.length === 0 && aliveSerialKillers.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`stab`,
				guide:`stab <player>`,
				description:`Kills the target.`,
				priority:5,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({ firstTarget })=>{
					return `You have decided to kill ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user,firstTarget: target, game, performer})=>{
					if(target === 'None') return game.removeActionOf(user);
					const targetNotif = new Notif({
						newsForSpy: `Your target was attacked by a Serial Killer!`
					})
					const killerNotif = new Notif({})
					if(target.getBuffs().length===1) 
						return target.calculateBuff({
							killer: performer,
							targetNotif: targetNotif,
							killerNotif: killerNotif
						});

					if(target.getRole().getDefense() < performer.getRole().getAttack()){
						target.kill();
						target.pushCauseOfDeath(`stabbed by a Serial Killer.`);
						targetNotif.setInbox(`You were attacked by a Serial Killer!`);
					}else{
						targetNotif.setInbox(`Someone attacked you last night but you were immune!`);
						killerNotif.setInbox(`Your target's defense was too strong! You failed to kill your target.`);
						performer.pushNotif(killerNotif);
					}
					target.pushNotif(targetNotif);
				},
			},
		],
	},
	{
		id:`209`,
		name:`Werewolf`,
		alignment:`Neutral`,
		type:`Killing`,
		immunities:[],
		attack:2,
		defense:1,
		unique:true,
		results:{
			investigator:`Your target could be a Sheriff, Executioner, or Werewolf.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Werewolf!`
		},
		abilities:[
			`You can go on a rampage at someone's house during full moons.`,
			`You are immune to night attacks.`
		],
		goals:[
			`Be the last person alive.`
		],
		nightMessage:`You can use your ability now`,
		roleMessage:`Pick who to kill.`,
		winBuddies:[`Werewolf`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveFriends: Player[] = [];
			const aliveEnemies: Player[] = [];
			const aliveSerialKillers: Player[] = [];
			game.getAlivePlayers().map(p => {
				if(p.role.name === 'Werewolf') return aliveSerialKillers.push(p);
				if( p.role.alignment === 'Neutral' && p.role.type === 'Evil' ||
					p.role.alignment === 'Neutral' && p.role.type === 'Benign')
					return aliveFriends.push(p);
				return aliveEnemies.push(p);
			})
			if(aliveEnemies.length === 0 && aliveSerialKillers.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`maul`,
				guide:`maul <player>`,
				description:`Kills the target.`,
				priority:5,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: true,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to go on a rampage at ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}'s house.`
				},
				run:({ game, firstTarget: target, user, performer })=>{
					if(target === 'None') return game.removeActionOf(user);

					const targetNotif = new Notif({ 
						inbox: `A werewolf went on a rampage at your house!`,
						newsForSpy: `Your target was attacked by a Werewolf!` 
					})
					const werewolfNotif = new Notif({ inbox: `Your target's defense was too strong! You failed to kill your target.` })

					if(target.getBuffs().length>0)
						return target.calculateBuff({
							killer: performer,
							targetNotif: targetNotif,
							killerNotif: werewolfNotif
						});

					if(target.getRole().getDefense() < performer.getRole().getAttack()){
						target.kill();
						target.pushCauseOfDeath(`mauled by a Werewolf.`);
						targetNotif.setInbox(`A werewolf went on a rampage at your house!`)

						const visitorsNotif = new Notif({
							inbox: `A werewolf went on a rampage at your target's house!`,
							newsForSpy: `Your target was attacked by a Werewolf!`
						})

						const visitors = game.getVisitorsOf(target);
						
						visitors.forEach(visitor => {
							if(visitor.getId() != performer.getId()){
								visitor.kill();
								visitor.pushNotif(visitorsNotif);
							}
						});
					}else{
						targetNotif.inbox = `Someone attacked you last night but you were immune!`;
						werewolfNotif.inbox = `Your target's defense was too strong! You failed to kill your target.`,
						performer.pushNotif(werewolfNotif);
					}
					target.pushNotif(targetNotif);
				},
			},
		],
	},
	// {
	//     id:`207`,
	//     name:`Arsonist`,
	//     alignment:`Neutral`,
	//     type:`Killing`,
	//     immunities:[],
	//     attack:3,
	//     defense:1,
	//     unique:false,
	//     results:{
	//         investigator:`Your target could be a Bodyguard, Godfather, or Arsonist.`,
	//         sheriff:`Your target is suspicious!`,
	//         consigliere:`Your target seems to be an Arsonist.`
	//     },
	//     abilities:[
	//         `You can douse 1 person each night.`,
	//         `You are immune to night attacks.`
	//     ],
	//     goals:[
	//         `Be the last person alive.`
	//     ],
	//     nightMessage:`You can use your ability now`,
	//     roleMessage:`Pick who to douse or decide to light the fire.`,
	//     winBuddies:[`Arsonist`,`Witch`,`Survivor`,`Executioner`,`Jester`],
	//     commands:[
	//         {
	//             name:`douse`,
	//             guide:`douse <player>`,
	//             description:`Douses the target.`,
	//             priority:3,
	//             stocks:99,
	//             permission:`Role Holder`,
	//             queue:`Normal`,
	//             requiredTargets:1,
	//             phase:[`Night`],
	//             status:`Alive`,
	//             hasMenu: true,
							// hasArguments: false,
							// inputSeparator: ',',
							// performer:(user,command,game)=>{
	//                 return user;
	//             },
	//             visitsTarget:({user, game})=>{
	//                 return true;
	//             },
	//             targetables:({user, game})=>{
	//                 let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
	//                 return targetables;
	//             },
	//             callResponse:async (user,command,{firstTarget},game)=>{
	//                 return `You have decided to douse ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
	//             },
	//             run:(user,performer,command,{ game, firstTarget, secondTarget })=>{
	//                 let target = targets[0];
	//                 target.setDouseStatus(true);
	//             },
	//         },
	//         {
	//             name:`light`,
	//             guide:`light`,
	//             description:`Sets all the doused houses on fire.`,
	//             priority:5,
	//             stocks:99,
	//             permission:`Role Holder`,
	//             queue:`Normal`,
	//             requiredTargets:0,
	//             phase:[`Night`],
	//             status:`Alive`,
	//             hasMenu: true,
							// hasArguments: false,
							// inputSeparator: ',',
							// performer:(user,command,game)=>{
	//                 return user;
	//             },
	//             visitsTarget:({user, game})=>{
	//                 return false;
	//             },
	//             callResponse:async (user,command,{firstTarget},game)=>{
	//                 return `You have decided to light the doused houses.`
	//             },
	//             run:(user,performer,command,{ game, firstTarget, secondTarget })=>{
	//                 let doused = game.getPlayers().filter(p=>p.getDouseStatus()==true && p.isAlive());
	//                 doused.forEach(d => {
	//                     d.kill();
	//                     d.pushCauseOfDeath(`incenerated by an Arsonist.`);
	//                     let notif1 = {
	//                         player: `You were set on fire!`,
	//                         spy: `Your target was set on fire!`
	//                     }
	//                     d.pushNotif(notif1);
	//                 });
	//             },
	//         },
	//     ],
	// },
	{
		id:`010`,
		name:`Doctor`,
		alignment:`Town`,
		type:`Protective`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Doctor, Disguiser, or Serial Killer.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Doctor.`
		},
		abilities:[
			`You can heal someone each night.`,
			`You can heal yourself. (One time use)`
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick someone to heal. (letter)`,
		winBuddies:[`game`,`Survivor`,`Amnesiac`,`Jester`,`Executioner`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`heal`,
				guide:`heal <player>`,
				description:`Heals the target.`,
				priority:3,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername() && p.getVoteCount()!=3);
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to heal ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({firstTarget: target, user, game})=>{
					if(target === 'None') return game.removeActionOf(user);
					target.pushBuff(`Heal`);
				},
			},
			{
				name:`selfheal`,
				guide:`selfheal`,
				description:`Heals yourself.`,
				priority:3,
				stocks:1,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:0,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: false,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:() => null,
				callResponse:async ()=>{
						return `You have decided to heal yourself.`
				},
				defaultTarget:({ user } ) => [user],
				run:({command,firstTarget: target, game, user})=>{
					if(target === 'None') return game.removeActionOf(user)
					command.decrementStock();
					target.pushBuff(`Heal`);
				},
			},
		],
	},
	{
		id:`009`,
		name:`Bodyguard`,
		alignment:`Town`,
		type:`Protective`,
		immunities:[],
		attack:2,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Bodyguard, Godfather, or Arsonist.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Bodyguard.`
		},
		abilities:[
			`You can protect someone each night.`,
			`You can shield yourself for one night.`,
		],
		goals:[
			`Lynch/kill all of the evildoers`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick someone to protect. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`protect`,
				guide:`protect <player>`,
				description:`Protects the target.`,
				priority:3,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({user, game})=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getUsername() != user.getUsername());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to protect ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({firstTarget: target, user, game})=>{
					if(target === 'None') return game.removeActionOf(user);
					target.pushBuff(`Protect`);
				},
			},
			{
				name:`vest`,
				guide:`vest`,
				description:`Be immune to any attacks at night.`,
				priority:3,
				stocks:1,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:0,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: false,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:() => null,
				defaultTarget:({ user } ) => [user],
				callResponse:async ()=>{
					return `You have decided to wear a vest tonight.`
				},
				run:({command,firstTarget: target, game, user})=>{
					if(target === 'None') return game.removeActionOf(user)
					game.removeActionOf(user)
					command.decrementStock();
					target.pushBuff(`Vest`);
				},
			},
		],
	},
	// {
	//     id:`011`,
	//     name:`Mayor`,
	//     alignment:`Town`,
	//     type:`Support`,
	//     immunities:[],
	//     attack:0,
	//     defense:0,
	//     unique:true,
	//     results:{
	//         investigator:`Your target could be a Investigator, Consigliere, or Mayor.`,
	//         sheriff:`Your target seems innocent.`,
	//         consigliere:`Your target seems to be the Mayor.`
	//     },
	//     abilities:[
	//         `Gain 3 votes when you reveal yourself as Mayor.`
	//     ],
	//     goals:[
	//         `Lynch all of the evildoers`
	//     ],
	//     nightMessage:`Sleep tight..`,
	//     roleMessage:`Choose whether to reveal or not.`,
	//     winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
	//     commands:[
	//         {
	//             name:`reveal`,
	//             guide:`reveal`,
	//             description:`Reveals to everyone that you are the mayor.`,
	//             priority:1,
	//             stocks:1,
	//             permission:`Role Holder`,
	//             queue:`Quick`,
	//             requiredTargets:0,
	//             phase:[`Discussion`, `Voting`, `Defense`,`Judgement`],
	//             status:`Alive`,
	//             hasMenu: true,
							// hasArguments: false,
							// inputSeparator: ',',
							// performer:(user,command,game)=>{
	//                 return user;
	//             },
	//             visitsTarget:({user, game})=>{
	//                 return false;
	//             },
	//             defaultTarget:({user, game})=>{
	//                 return [user];
	//             },
	//             callResponse:async (user,command,{firstTarget},game)=>{
	//                 command.setStocks(command.getStocks()-1);
	//                 user.setVoteCount(3);
	//                 let msg = `${user.getUsername()} has revealed to everyone that they are the Mayor!`;
	//                 game.getFunctions().messagePlayersWrapped(msg);
	//                 return `You have revealed to everyone that you are the Mayor!`
									
	//             },
	//             run:(user,performer,command,{ game, firstTarget, secondTarget })=>{
									
	//             },
	//         }
	//     ],
	// },
	{
		id:`012`,
		name:`Medium`,
		alignment:`Town`,
		type:`Support`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Medium, Janitor, or Retributionist.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Medium.`
		},
		abilities:[
			`You can talk to ghosts every night.`
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can talk to ghosts.`,
		roleMessage:`You can talk to ghosts.`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`seance`,
				guide:`seance <player>`,
				description:`Lets you talk to the target.`,
				priority:1,
				stocks:1,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Discussion`,`Voting`,`Judgement`,`Defense`,`Final Words`,`Execution`],
				requiredStatus:[`Dead`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to seance ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({user, command, firstTarget: target, game, performer})=>{
					if(target === 'None') return game.removeActionOf(user);
					command.decrementStock();
					target.setSeanceStatus(true);
					performer.setSeanceStatus(true);
				},
			}
		],
	},
	{
		id:`014`,
		name:`Spy`,
		alignment:`Town`,
		type:`Investigative`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Spy, Blackmailer, or Jailor.`,
			sheriff:`Your target seems innocent.`,
			consigliere:`Your target seems to be a Spy.`
		},
		abilities:[
			`You can hear Mafia conversations at night.`,
			`You can know who the mafia visits.`
		],
		goals:[
			`Lynch all of the evildoers`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to spy on. (letter)`,
		winBuddies:[`game`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEvil: Player[] = [];
			const aliveTown: Player[] = [];
			game.getAlivePlayers().map(p => {
				p.role.alignment === 'Town' && aliveTown.push(p)
				if(p.role.alignment === 'Mafia' || 
				p.role.alignment === 'Neutral' && p.role.type !== 'Benign') aliveEvil.push(p)
			});
			if(aliveEvil.length === 0 && aliveTown.length>0)
				return true
			return false;
		},
		commands:[
			{
				name:`bug`,
				guide:`bug <player>`,
				description:`Bugs someone's house to see what happens to them at night.`,
				priority:6,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:({user, game}) => game.getPlayers().filter(p => p.isAlive() && p.getId()!=user.getId()),
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
						return `You have decided to bug ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}'s house.`
				},
				run:({user, firstTarget: target, game, performer})=>{
					if(target === 'None') return game.removeActionOf(user)
					target.getNotifs().forEach(notif => {
						const performerNotif = new Notif({ inbox: notif.newsForSpy })
						performer.pushNotif(performerNotif);
					});
				},
			},
		],
	},
	// {
	//     id:`204`,
	//     name:`Executioner`,
	//     alignment:`Neutral`,
	//     type:`Evil`,
	//     immunities:[],
	//     attack:0,
	//     defense:1,
	//     unique:false,
	//     results:{
	//         investigator:`Your target could be a Sheriff, Executioner, or Werewolf.`,
	//         sheriff:`Your target is suspicious!`,
	//         consigliere:`Your target seems to be an Executioner.`
	//     },
	//     abilities:[
	//         `You are immune to night attacks.`
	//     ],
	//     goals:[
	//         `Lynch your target.`
	//     ],
	//     nightMessage:`Sleep tight...`,
	//     roleMessage:`Convince everyone to lynch your target.`,
	//     winBuddies:[],
	//     commands:[],
	// },
	{
		id:`205`,
		name:`Jester`,
		alignment:`Neutral`,
		type:`Evil`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Framer, Vampire, or Jester.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be an Jester.`
		},
		abilities:[
			`None.`
		],
		goals:[
			`Get yourself lynched.`
		],
		nightMessage:`Sleep tight...`,
		roleMessage:`Convince everyone to lynch you.`,
		winBuddies:[],
		winListener: () => {
			return false;
		},
		commands:[
			{
				name:`haunt`,
				guide:`haunt <player>`,
				description:`Kills the target.`,
				priority:1,
				stocks:0,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Dead`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => false,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p=>p.getJudgement()[p.getJudgement().length-1]==`Guilty` && p.isAlive());
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({firstTarget})=>{
					return `You have decided to haunt ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({ command, firstTarget: target, game, user })=>{
					if(target === 'None') return game.removeActionOf(user)
					command.decrementStock();
					target.kill();
					target.pushCauseOfDeath(`haunted by the Jester's ghost.`);
					const targetNotif = new Notif({ inbox: `You were haunted by the jester!` })
					target.pushNotif(targetNotif);
				},
			}
		],
	},
	{
		id:`103`,
		name:`Janitor`,
		alignment:`Mafia`,
		type:`Support`,
		immunities:[],
		attack:0,
		defense:0,
		unique:false,
		results:{
			investigator:`Your target could be a Medium, Janitor, or Retributionist.`,
			sheriff:`Your target is suspicious!`,
			consigliere:`Your target seems to be a Janitor.`
		},
		abilities:[
			`You can erase the traces of each mafia kills.`
		],
		goals:[
			`Make the mafia the last ones to survive.`
		],
		nightMessage:`You can use your ability now.`,
		roleMessage:`Pick who to clean. (letter)`,
		winBuddies:[`Mafia`,`Witch`,`Survivor`,`Executioner`,`Jester`],
		winListener: ({game}) => {
			const aliveEnemies: Player[] = [];
			const aliveMafia: Player[] = [];
			game.getAlivePlayers().map(p => {
				if( p.role.alignment === 'Neutral' && 
					p.role.type !== 'Benign' && 
					p.role.type !== 'Evil' || 
					p.role.alignment === 'Town') 
					aliveEnemies.push(p)
				if(p.role.alignment === 'Mafia')
					aliveMafia.push(p);
			})
			if(aliveEnemies.length === 0 && aliveMafia.length > 0)
				return true
			return false;
		},
		commands:[
			{
				name:`clean`,
				guide:`clean <player>`,
				description:`Cleans the traces left behind by Mafia's murder victim.`,
				priority:3,
				stocks:99,
				type:`Skill Command`,
				queue:`Normal`,
				targetCount:1,
				lethal: false,
				phase:[`Night`],
				requiredStatus:[`Alive`],
				hasMenu: true,
				hasArguments: false,
				inputSeparator: ',',
				performer:({ user }) => user,
				visitsTarget:() => true,
				targetables:({ game })=>{
					let targetables = game.getPlayers().filter(p => p.isAlive() && p.getRole().getAlignment() != `Mafia`);
					return targetables;
				},
				defaultTarget:({} )=> [],
				callResponse:async ({user, firstTarget, game})=>{
					const msg = `${user.getUsername()} has decided to clean ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
					await user.messageOtherMafias(msg);
					return `You have decided to clean ${firstTarget === 'None' ? 'no one' : firstTarget.getUsername()}.`
				},
				run:({firstTarget: target, game, user})=>{
					if( target === 'None') return game.removeActionOf(user)
					target.setCleandName(target.getMaskRole().getName());
					target.setCleanedNotes(target.getNotes());
					target.getMaskRole().setName(`Cleaned`);
					target.setNotes(``);
				},
			},
		],
	},

];

export default roles