import Host from './host';
import Clock from './clock';
import Setup from './setup';
import Notif from './notif';
import Action from './action';
import Player from './player';
import roledump from './roledump';
import Functions from './functions';
import { SalemRole } from './roles';
import SalemServer from '../../Servers/SalemServer';
import { Guild, Role as DiscordRole } from 'discord.js';
import { createEmbed, delay, jsonWrap } from '../../Helpers/toolbox';
import { phaseCommandsButtons } from './channel/messageManagers/collectors';

export type JudgementChoices = 'Abstain' | 'Guilty' | 'Innocent'

interface ConstructorParams {
	guild: Guild,
	server: SalemServer,
}

interface Judgement {
	judge: Player, 
	choice: JudgementChoices,
	string: string
}

interface Vote {
	voter: Player,
	voted: Player
}

export default class Game{

	id: string;

	title: 'Town of Salem';
	prefix = '.';
	
	guild: Guild;
	server: SalemServer;
	
	host: Host;
	clock: Clock;
	setup: Setup;
	functions: Functions;
	
	gameKey: DiscordRole;
	rolesToRemove: string[] = [];

	players: Player[] = [];
	rolePool: SalemRole[] = [];

	actions: Action[] = [];

	votes: Vote[] = [];
	votedUp: Player | null = null;
	judgeString = '';
	judgements: Judgement[] = [];
	freshDeaths: Player[] = [];
	freshReborn: Player[] = [];
	jailedPlayer: Player | null = null;

	constructor({server,guild}: ConstructorParams){
		this.guild = guild;
		this.server = server;
		this.id = `${guild.id}`;
		roledump.map((r)=>r.Roles.map((id)=>this.rolesToRemove.push(id)));
		this.setup = new Setup(this);
		this.clock = new Clock(this);
		this.functions = new Functions(this);
	}  

	// ---------------------- Functions

	setupGame = async () => {
		await this.setup.setupPlayers();
		await this.setup.createGameRole();
		await this.setup.distributeGameRole();
		await this.setup.activatePlayerListeners();
		await this.setup.sendWelcomeGuide();
		await this.setup.setupExeTarget();
		await delay(2000);
		await this.showAndUnlockPlayerChannels();
		await this.host.notifyGameStart();
		this.clock.runTimer();
		await this.clock.playLobby();
	}

	managePlayerPhaseMenus = () => this.getPlayers().map( async (player)=> {
		await player.getChannelManager().managePhaseMenu().delete()
		if ( this.clock.phase.showPhaseMenu ){
			await player.getChannelManager().managePhaseMenu().create()
			player.getChannelManager().managePhaseMenu().applyReactionCollector(phaseCommandsButtons);
		}
	})
		
	updateWerewolf = () => {
		const round = this.clock.getRound();
		const werewolves = this.getPlayersWithRole('Werewolf');
		const report = round%2==0 ? 'Your target is suspicious! ': 'Your target seems innocent.';
		werewolves.forEach(werewolf => werewolf.getMaskRole().getResults().setSheriff(report) );
	}

	resetNight = async () => this.players.map(p =>  p.setMuteStatus(false));

	updatePlayerLists = async () => this.players.map(p => p.getChannelManager().managePlayerList().update());

	resetDay = () => {
		this.players
		.filter(p=>p.getRole().getName()=='Jester' && p.getStatus()=='Dead')
		.map(jester => jester.getRole().getCommands().filter(c=>c.getName()=='haunt')[0].setStocks(0))

		this.players.map(player => player.resetYesterdayStatus());
		this.clock.resetExcessDuration();
	}

	deathListener = async () => {
		const currentPeaceCount = this.clock.getPeaceCount();
		this.clock.setPeaceCount(currentPeaceCount+1);
		if(this.freshDeaths.length === 0 )return 
		this.clock.setPeaceCount(0);
		for await (const player of this.freshDeaths) 
			await player.playDeath();
		this.freshDeaths=[];
	}

	rebornListener = async () => {
		if(this.freshReborn.length<=0)return;
		for (const player of this.freshReborn) 
			await player.playResurrection()
		this.clearFreshReborn();
	}

	
	pushAction = (action: Action) => {
		const index = this.actions.findIndex(a => a.user.getId() == action.getUser().getId());
		if(index === -1) 
			return this.actions.push(action)
		return this.actions[index]=action  
	}

	removeActionOf = (player: Player) => {
		const index = this.actions.findIndex(a => a.user.getId() == player.getId());
		if(index === -1) 
			return false
		this.actions.splice(index,1);
		return true
	}

	arrangeActions = () =>{
		return this.actions.sort((a,b)=>{
			const aPriority = a.getCommand().getPriority();
			const bPriority = b.getCommand().getPriority();
			if(aPriority<bPriority)return -1;
			if(aPriority>bPriority)return 1;
			return 0;
		});
	}

	listenForWinners = () => {
		this.getAlivePlayers().map(( player )=> player.listenForTheWin())
		const endGameWinners = this.getAlivePlayers().filter(p => p.isWinner() 
		&& p.role.name !== 'Jester'
		&& p.role.name !== 'Executioner');
		if(endGameWinners.length>0){
			const survivors = this.getAlivePlayers().filter(p => p.role.name === 'Survivor');
			survivors.map(s => s.setWinStatus(true));
			const anyWinner = endGameWinners[0];
			if(anyWinner.role.alignment !== 'Town'){
				const witches = this.getAlivePlayers().filter(p => p.role.name ==='Witch');
				witches.map(w => w.setWinStatus(true));
			}
			this.clock.setNextPhase('Game Over');
		}
	}

	listenForDraw = () => {
		const peaceCount = this.clock.getPeaceCount();
		const maxPeaceCount = this.clock.getMaxPeaceCount();
		if(peaceCount === maxPeaceCount){
			this.clock.setNextPhase('Game Over');
		}
	}

	processActions(){
			
		this.actions = this.arrangeActions();
		this.actions.map(action => {

			const actionProps = action.getProperties();
			const { firstTarget, secondTarget, performer, command, game } = actionProps
			const actionVisitsTarget = command.visitsTarget({ game, performer })

			if(	
					command.getTargetCount() === 0  
					&& firstTarget !== 'None'
					&& firstTarget.isNotJailed() 
					|| command.getTargetCount() === 1  
					&& firstTarget !== 'None'
					&& firstTarget.isNotJailed() 
					|| command.getTargetCount() === 2  
					&& firstTarget !== 'None' 
					&& firstTarget.isNotJailed() 
					&& secondTarget !== 'None' 
					&& secondTarget.isNotJailed() 
				){
					if(firstTarget.getBuffs().find( buff => buff === 'Alert' )){
						if(actionVisitsTarget){
							const visitedNotif = new Notif({ inbox: `You shot the person who visited you last night!` })
							const visitorNotif = new Notif({ inbox: `You were shot by the Veteran that you visited!` })
							performer.kill();
							performer.pushNotif(visitorNotif);
							firstTarget.pushNotif(visitedNotif);
							performer.pushCauseOfDeath(`shot by a Veteran.`);
						}
					}else{
						if(performer.isNotRoleBlocked()){
							command.run(actionProps);

							if(actionVisitsTarget)
								action.getTargets().map( target => {
									if(target !== 'None' && target !==undefined)
										target.pushVisitor(performer)
								})
						}
					}
			}else{
				const notice = performer.roleNameIs('Transporter') ?
					'One of your targets was in jail!\nThe transportation has failed!' :
					'Your target was in jail!'
					performer.pushNotif(new Notif({ inbox: notice }));
			}
			action.setStatus('Done');
		});

		this.clearActions();
				
		if(this.freshDeaths.length>0){
			this.freshDeaths.map( p => p.pushNotif(new Notif({inbox: `You have died.`})));
		}
		
		this.players.map(p => {
			if(p.getNotifs().length===0)return
			const string = p.getNotifs().map((n)=>n.inbox).join('\n')
			p.sendMarkDownToChannel(string);
			p.clearNotifs();
		});
	}

	getVisitorsOf = (a: Player) => a.getVisitors();

	// ----------------------- Game Starter

	gameStart = async () => {
		this.players.map(p => p.cleanChannel());
		const time = 5;
		this.clock.setSecondsRemaining(time);
		await this.lockPlayerChannels();
	}
	
	// ----------------------- Setters & Getters
	getJudgements = () => this.judgements;
	pushJudgement( rawJudgement : {judge: Player,choice: JudgementChoices} ){
		const { judge, choice } = rawJudgement;
		const previousJudgement = this.judgements.find(j => j.judge.getId() === judge.getId());
		if(previousJudgement){
			if(previousJudgement.choice === choice) return
			const string = (choice === 'Abstain') ? 
				`**${judge.getUsername()}** has cancelled their vote.` : 
				`**${judge.getUsername()}** has changed their vote.`
			const judgement = {...rawJudgement,string};
			this.judgements.push(judgement);
		}else{
			const string =`**${judge.getUsername()}** has voted.`
			const judgement = {...rawJudgement,string, final: true};
			this.judgements.push(judgement);
		}
		this.updatePlayerJudgements();
	}
	
	updatePlayerJudgements = () => this.players.map(p => p.getChannelManager().manageJudgement().update());

	endPlayerInteractions = () => this.players.map( p => p.endAllActionInteractions());

	cleanMessageComponents = () => this.players.map(p => p.cleanMessageComponents());
	
	getVotes = () => this.votes;
	clearVotes = () => this.votes = [];
	
	pushVote = (vote: Vote) => {
		const { voter, voted } = vote;
		const oldVote = this.votes.find(v => v.voter.getId() === voter.getId());
		if(oldVote){
			if(oldVote.voted.getId() === voted.getId()) return null
			this.votes[ this.votes.indexOf(oldVote) ] = { voter:voter, voted:voted }   
		}else{
			this.votes.push(vote);
		}

		const ballots = this.votes.filter(v=>v.voted.getId()===voted.getId());
		const voteCount = ballots.reduce(( total,vote ) => total += vote.voter.getVoteCount(), 0);
		const grammar = voteCount > 1 ? 'votes' : 'vote';
		const aliveCount = this.getAlivePlayers().length;
		const goal = (aliveCount % 2 === 0) ? ( aliveCount / 2 ) + 1 : ( aliveCount + 1 ) / 2;
		// const goal = 1;

		const msg = `${voter.getUsername()} has voted against ${voted.getUsername()}. (${voteCount}/${goal} ${grammar})`
		
		if(voteCount===goal){
			this.functions.messagePlayers(jsonWrap(msg));
			this.clock.setNextPhase('Defense');
			this.clock.setExcessDuration(this.clock.getSecondsRemaining());
			this.clock.skipPhase();
			this.setVotedUp(voted);
			return null
		}
		
		this.functions.messageOtherPlayers(voter,jsonWrap(msg));
		return msg
	}

	removeVoteOf = async (voter: Player) => {
		const vote = this.votes.find(v => v.voter.getId() === voter.getId());
		if(!vote) return false;

		const index = this.votes.indexOf(vote);
		if (index !== -1) { this.votes.splice(index, 1) }
		const voteCount = this.votes.filter(v=>v.voted.getId()===vote.voted.getId()).length;
		const grammar = voteCount > 1 ? 'votes' : 'vote';
		const msg = jsonWrap(`${voter.getUsername()} has cancelled their vote against ${vote.voted.getUsername()}. (${voteCount} ${grammar})`)
		this.functions.messagePlayers(msg);
		return true
	}

	showPlayerChannels = async () => this.getPlayers().map( p => p.getChannelManager().show());
	lockPlayerChannels = async () => this.getPlayers().map( p => p.getChannelManager().lock());
	unlockPlayerChannels = async () => this.getPlayers().map(p => p.getChannelManager().unlock())
	showAndUnlockPlayerChannels = async () => this.getPlayers().map( p => p.getChannelManager().showAndUnlock());

	getHost = () => this.host;
	setHost = (a:Host) => this.host = a;
	
	getPrefix = () => this.prefix;
	setPrefix = (a: string) => this.prefix = a;

	getSetup = () => this.setup;
	setSetup = (a: Setup) => this.setup = a;

	getFunctions = () => this.functions;
	setFunctions = (a: Functions) => this.functions = a;
	
	setRolePool = (a: SalemRole[]) => this.rolePool = a;
	getRolePool = () => this.rolePool;

	getFreshDeaths = () => this.freshDeaths
	clearFreshDeaths = () => this.freshDeaths=[];

	getFreshReborn = () => this.freshReborn;
	pushFreshReborn = (a:Player) => this.freshReborn.push(a)
	clearFreshReborn = () => this.freshReborn = []
	
	roleExists = (a:string) => this.players.filter((p)=>p.getRoleName()===a).length>0;

	getPlayers = () => this.players;
	connectPlayer = (a: Player) => this.players.push(a);

	getMafias = () => this.players.filter(p => p.getRole().getAlignment()==='Mafia');
	getAliveMafias = () => this.players.filter(p => p.getRole().getAlignment()==='Mafia' && p.isAlive());

	getNonMafias = () => this.players.filter(p => p.getRole().getAlignment()!=='Mafia');

	getDeadPlayers = () => this.players.filter(( p ) => p.getStatus() === 'Dead');
	getAlivePlayers = () => this.players.filter(( p ) => p.getStatus() === 'Alive');

	getTitle = () => this.title;

	pushFreshDeath = (player: Player) => {
		const index = this.freshDeaths.findIndex(dead => dead.getId() === player.getId());
		if(index === -1) this.freshDeaths.push(player);
	}

	getVotedUp = () => this.votedUp
	setVotedUp = (a: Player) => this.votedUp = a
	clearVotedUp = () => this.votedUp = null;

	getSeanced = () => this.players.find(( p ) => p.getSeanceStatus());
	getMediums = () => this.players.filter((p)=>p.getRole().getName() === 'Medium' && p.isAlive());

	getRolesToRemove = () => this.rolesToRemove;
	pushRoleToRemove = (a: string) => this.rolesToRemove.push(a) 
	setRoleToRemove = (a: string) => this.rolesToRemove = [ a ];
	clearRolesToRemove = () => this.rolesToRemove = [];

	getActions = () => this.actions;
	clearActions = () => this.actions = [];

	getActionOf = (player:Player) => this.actions.find((a)=>a.getPerformer().getId() === player.getId());

	getId = () => this.id;

	getJailor = () => this.players.filter( p => p.getRole().getName() === 'Jailor')[0];
	
	getJailedPerson = () => {
		const jailedPerson = this.players.find(p=>p.isJailed()) 
		return jailedPerson ? jailedPerson : null;
	}

	getServer = () => this.server
	getGameKey = () =>  this.gameKey;
	setGameKey = ( key: DiscordRole ) => this.gameKey = key;

	getGuild = () => this.guild
	setGuild = ( guild: Guild ) => this.guild = guild

	getClock = () => this.clock;
	setClock = (a: Clock) => this.clock = a;

	getPlayersWithStatus = (status:string) => this.players.filter(p=>p.getStatus()===status);
	getPlayersWithRole = (role:string) => this.players.filter(p=>p.getRole().getName()==role);
	
	isAdmin = (a:Player) => a.getId() === '481672943659909120';
	isHost = (a:Player) => this.host.getHostId() === a.getId();

	// ------------------------- Game Ender

	quit = async () => {
		this.clock.terminateTimer();
		await this.gameKey.delete()
		for await (const player of this.players) {
			player.getExRoles().map( role => player.getDiscord().roles.add(role));
			player.getChannel().delete().catch(()=> console.log ("Couldn't delete channel"));
		}
		await this.host.notifyGameEnd();
		this.server.removeGame(this);
		this.server.disconnectGuild(this.guild)
	}
	
}
