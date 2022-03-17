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
		await this.getSetup().setupPlayers();
		await this.getSetup().createGameRole();
		await this.getSetup().distributeGameRole();
		await this.getSetup().activatePlayerListeners();
		await this.showAndUnlockPlayerChannels();
		await this.getSetup().setupExeTarget();
		await this.getHost().notifyGameStart();
		this.getClock().runTimer();
		await this.getClock().playLobby();
	}

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
		this.getClock().resetExcessDuration();
	}

	deathListener = async () => {
		const currentPeaceCount = this.getClock().getPeaceCount();
		this.getClock().setPeaceCount(currentPeaceCount+1);
		if(this.freshDeaths.length === 0 )return 
		this.getClock().setPeaceCount(0);
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
		const endGameWinners = this.getAlivePlayers().filter(p => p.isAWinner() 
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

	processActions(){
			
		this.actions = this.arrangeActions();
		this.actions.map(a => {

			const GAME_USER_DATA = { game: this, user: a.getPerformer() }

			if(!a.getFirstTarget().isJailed() || a.getUser().roleNameIs('Jailor')){
					if(a.getFirstTarget().getBuffs().find( b => b === 'Alert' )){
						if(a.getCommand().visitsTarget(GAME_USER_DATA)){
							const visitedNotif = new Notif({ inbox: `You shot the person who visited you last night!` })
							const visitorNotif = new Notif({ inbox: `You were shot by the Veteran that you visited!` })
							a.getFirstTarget().pushNotif(visitedNotif);
							a.getPerformer().pushNotif(visitorNotif);
							a.getPerformer().kill();
							a.getPerformer().pushCauseOfDeath(`shot by a Veteran.`);
						}
					}else{
						if(!a.getPerformer().isRoleBlocked()){
							a.getCommand().run({
								game: this,
								user: a.getPerformer(),
								args: a.getArgs(),
								command: a.getCommand(),
								targetOne: a.getFirstTarget(),
								targetTwo: a.getSecondTarget(),
							});
							if(a.getCommand().visitsTarget(GAME_USER_DATA)){
								a.getTargets().forEach( t => t.pushVisitor(a.getPerformer()) );
							}
						}
					}
			}else{
				const notice = a.getPerformer().roleNameIs('Transporter') ?
					'One of your targets was in jail!\nThe transportation has failed!' :
					'Your target was in jail!'
				a.getPerformer().pushNotif(new Notif({inbox: notice}));
			}
			a.setStatus('Done');
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
		const time = 5;
		this.getClock().freezeTime();
		this.getClock().setSecondsRemaining(0);
		await this.lockPlayerChannels();

		this.players.map( async (player) => {
			await player.cleanChannel();
			const embed = createEmbed({description: `Game will start in ${time}...`})
			await player.getChannelManager().manageCountDown().create(embed);
		})
		
		await delay(1500);

		for (let i = time-1;i>0;i--){
			this.players.map(player =>{
				const embed = createEmbed({description: `Game will start in ${i}...`});
				player.getChannelManager().manageCountDown().update(embed);
			});
			await delay(1500);
		}

		this.players.map((p)=> p.getChannelManager().manageCountDown().delete());
		this.getClock().startGame();
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
	
	getVotes = () => this.votes;
	clearVotes = () => this.votes = [];
	
	pushVote = (vote: Vote) => {
		const { voter, voted } = vote;
		const oldVote = this.votes.find(v => v.voter.getId() === voter.getId());
		if(oldVote){
			if(oldVote.voted.getId() !== voted.getId()){
				const i = this.votes.indexOf(oldVote);
				const vote = { voter:voter, voted:voted }
				this.votes[i] = vote;   
			}else{
				return `**${voter.getUsername()}**, you can't vote the same person twice!`;
			}
		}else{
			this.votes.push(vote);
		}

		let voteCount=0;
		const ballots = this.votes.filter(v=>v.voted.getId()===voted.getId());
		ballots.forEach(b => voteCount += b.voter.getVoteCount()); // could use reduce function

		const grammar = voteCount > 1 ? 'votes' : 'vote';
		const aliveCount = this.players.filter(p=>p.isAlive()).length;
		// const goal = (aliveCount % 2 === 0) ? ( aliveCount / 2 ) + 1 : ( aliveCount + 1 ) / 2;
		const goal = 1;

		const msg = jsonWrap(`${voter.getUsername()} has voted against ${voted.getUsername()}. (${voteCount}/${goal} ${grammar})`)
		this.functions.messagePlayers(msg);
		if(voteCount==goal){
			this.getClock().setNextPhase('Defense');
			this.getClock().setExcessDuration(this.getClock().getSecondsRemaining());
			this.getClock().skipPhase();
			this.setVotedUp(voted);
		}
	}

	removeVoteOf = async (voter: Player) => {
		const vote = this.votes.find(v => v.voter.getId() === voter.getId());
		if(!vote) {
			await voter.alert(`You can't remove a vote if you haven't voted yet.`);
			return false;
		} 

		const index = this.votes.indexOf(vote);
		if (index !== -1) { this.votes.splice(index, 1) }
		const voteCount = this.votes.filter(v=>v.voted.getId()===vote.voted.getId()).length;
		const grammar = voteCount > 1 ? 'votes' : 'vote';
		const msg = jsonWrap(`${voter.getUsername()} has cancelled their vote against ${vote.voted.getUsername()}. (${voteCount} ${grammar})`)
		this.functions.messagePlayers(msg);
		await voter.alert(`You have cancelled your vote.`);
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
		this.getClock().terminateTimer();
		await this.gameKey.delete()
		for await (const player of this.players) {
			player.getExRoles().map( role => player.getDiscord().roles.add(role));
			player.getChannel().delete().catch(()=> console.log ("Couldn't delete channel"));
		}
		await this.getHost().notifyGameEnd();
		this.server.removeGame(this);
		this.server.disconnectGuild(this.guild)
	}
	
}
