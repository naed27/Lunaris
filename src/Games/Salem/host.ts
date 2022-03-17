import { Message, MessageEmbed, MessageReaction, ReactionCollector, TextChannel, User, GuildMember, MessageCollector } from 'discord.js';
import { arrayContainsElement, createEmbed, findElementInArray, getStringSearchResults, parseCommand, removeDuplicates, removeExtraWhitespaces, stringContainsOnlyDigits } from '../../Helpers/toolbox';
import Game from './game';
import { RolePoolElement } from './roles';
import roles from './roles';
import { PREFIX } from '../../main';
import { uniqueId } from 'lodash';

interface ConstructorParams {
	game:Game
	summoner:User,
	channel:TextChannel,
}

export default class Host{

	host: User;
	game: Game;
	channel: TextChannel;
	joinedPlayers: GuildMember[] = [];
	rolePool: RolePoolElement[] = [];

	hostPrefix = PREFIX;
	gameTitle:string;
	gameInvite: Message;
	reactCollector: ReactionCollector;
	messageCollector: MessageCollector;

	goFlag = `standby`;
	minimumRequiredPlayers = 2;
	maximumNumberOfPlayers = 5;

	salemRoles = roles;
	salemRoleNames = removeDuplicates(roles.map(role => role.name));
	salemRoleTypes = removeDuplicates(roles.map(role => role.type));
	salemRoleAlignment = removeDuplicates(roles.map(role => role.alignment));

	constructor({ summoner, game, channel }:ConstructorParams){
		this.game = game;
		this.host = summoner;
		this.channel = channel;
		this.gameTitle = game.getTitle();
	}

	getJoinedPlayers = () => this.joinedPlayers
	getHostId = () => this.host.id
	getGame = () => this.game
	isHost = ( user: User ) => user.id==this.host.id;

	getRolePool = () => this.rolePool;
	setRolePool = ( a: RolePoolElement[] ) => this.rolePool = a

	async sendGameInvite({channel, summoner}: {channel: TextChannel, summoner: User}){
		const embed = createEmbed({description: 'Loading...'});
		const gameInvite = await channel.send({embeds:[embed]});
		this.gameInvite = gameInvite;
		await this.updatePlayerList();

		// ------------- Message Collector -------------

		const messageFilter = (message:Message) => message.author.id === summoner.id;
		const messageCollector = this.channel.createMessageCollector({filter:messageFilter});
		this.messageCollector = messageCollector;

		messageCollector.on('collect',async (m)=>{
			const MESSAGE = m.content;
			const PREFIX = this.hostPrefix

			if(!MESSAGE.startsWith(PREFIX)) return

			const { COMMAND, ARGS } = parseCommand( PREFIX, MESSAGE, ',' );

			switch(COMMAND){
				case 'roleadd': this.addRolesToGame(ARGS); break;
				case 'roleremove': this.removeRolesFromGame(ARGS); break;
				case 'rolereplace': this.replaceRolesInGame(ARGS); break;
			}

			this.updatePlayerList();

			return
		})
		
		// ------------- Reaction Collector -------------

		const reactionFilter = (reaction:MessageReaction, user:User) => !user.bot;
		const reactCollector = gameInvite.createReactionCollector({filter:reactionFilter, time: 180000, dispose:true });
		this.reactCollector = reactCollector;

		reactCollector.on('collect', async (reaction, user) => {
			const reactionName = reaction.emoji.name;
			if(reactionName=="🚪") if(this.addPlayer(user)) return;
			if(reactionName=="▶️") if(this.activateGoFlag(user)) return;
			if(reactionName=="❌") return this.closeInvite();
			gameInvite.reactions.resolve(reaction.emoji.name).users.remove(user.id);
		});

		reactCollector.on('remove', async (reaction, user) => {
			if(reaction.emoji.name==="🚪") return this.removePlayer(user)
		});

		reactCollector.on('dispose', async (reaction) => {
			if(reaction.emoji.name==="❌") return this.reactCollector.stop();
		});

		reactCollector.on('end', async () => {
			this.messageCollector.stop();
			if(this.goFlag===`start`) { this.beginGame(); return }
			if(this.goFlag!==`standby`) return
			await gameInvite.reactions.removeAll();
			this.game.getServer().disconnectGuild(gameInvite.guild);
			this.cancelInvite()
			return this.game.getServer().removeGame(this.game);
		});

		await gameInvite.react('🚪');
		if(this.isHost(summoner)) await gameInvite.react('▶️');
		await gameInvite.react('❌');

	}

	closeInvite = () => this.reactCollector.stop();

	cancelInvite = async () => {
		await this.gameInvite.reactions.removeAll();
		const title = this.gameTitle;
		const description = `Game has been cancelled.`;
		const embed = createEmbed({title,description});
		this.gameInvite.edit({embeds:[embed]});
		this.reactCollector.stop();
		this.messageCollector.stop();
	}

	editHostMessage = async(embed:MessageEmbed) => this.gameInvite.edit({embeds:[embed]});

	activateGoFlag = ( user:User) =>{
		if(!this.isHost(user)) return false
		if(this.joinedPlayers.length<this.minimumRequiredPlayers) return false
		this.goFlag='start';
		this.reactCollector.stop();
		return true
	}

	beginGame = async() => {
		this.goFlag = `done`;
		const title = this.gameTitle;
		const players = this.joinedPlayers.map(p => `- ${p.user.username}`).join("\n");
		const description = `Players:\n${players}`;
		const footer = `Loading up the game. Please wait...`;
		
		const embed = createEmbed({ title,description,footer });
		this.gameInvite.reactions.removeAll();
		await this.gameInvite.edit({embeds:[embed]});
		await this.game.setupGame();
	}

	addPlayer = async ( user:User ) => {
		if( this.joinedPlayers.length >= this.maximumNumberOfPlayers ) return false
		const player = this.game.getGuild().members.cache.get(user.id);
		if( !this.isNewPlayer(player) ) return false
		this.joinedPlayers.push( player );
		this.updatePlayerList();
		return true
	}

	removePlayer = async ( user:User ) => {
		const player = this.game.getGuild().members.cache.get(user.id);
		this.joinedPlayers = this.joinedPlayers.filter((p) =>p.id != player.id);
		this.updatePlayerList();
	}

	isNewPlayer( user:GuildMember ){
		const result = this.joinedPlayers.filter(p => p.user.id == user.id);
		if(result.length==0)
			return true;
		return false;
	}

	updatePlayerList = async () => {
		const title = this.gameTitle;
		const playerList = this.joinedPlayers.map(p => `- ${p.user.username}`).join('\n');
		const roleList = this.rolePool
			.map(({name,type,alignment},i) =>`${i+1}. ${name!=='Random'?name:alignment+' '+type}`).join('\n');

		const description = 
			`Players:\n${playerList}\n\nRole Pool:\n${roleList}\n\nClick the 🚪 to join.`
		const footer = `Hosted by: ${this.host.username}`;
		const embed = createEmbed({ title,description,footer });
		await this.editHostMessage(embed);
	}

	async notifyGameStart(){
		const playerList = this.joinedPlayers.map(p => `- ${p.user.username}`).join("\n");
		const title = this.gameTitle;
		const description = `Players:\n${playerList}`;
		const footer = `Game is currently ongoing.`
		const embed = createEmbed({title,description,footer});
		await this.editHostMessage(embed);
	}

	async notifyGameEnd(){
		const results =  this.getGame().getPlayers().map(p => `- ${p.getUsername()}`).join("\n");
		const title = this.gameTitle;
		const description = `End Results:\n\n${results}`;
		const footer = `Game has ended.`
		const embed = createEmbed({title,description,footer});
		await this.editHostMessage(embed);
	}

	replaceRolesInGame = (args: string[]) =>{
		const indexes:{index:number|string,roleInput:string[]}[] = args.map(arg => {
			const noExtraWhitespaces = removeExtraWhitespaces(arg);
			const inputs = noExtraWhitespaces.split(' ');
			const [rawIndex,...roleInput] = inputs;
			const index = parseInt(rawIndex) ? (parseInt(rawIndex)-1) : 'invalid';
			if(index < this.rolePool.length) return ({index,roleInput})
			return ({index: 'invalid',roleInput: ['invalid']})
		});

		if(indexes.find(({index})=>index === 'invalid'))return

		const rolesToReplace = indexes.map(({index, roleInput}) => {
			return ({ id: this.rolePool[index].id, newData: roleInput.join(' ') })
		});
		
		this.rolePool = this.rolePool.map((roleElement)=>{
			const newInput = rolesToReplace.find(({id})=>id === roleElement.id)
			if( !newInput ) return roleElement
			return (
				this.findSpecificRole(newInput.newData) || 
				this.findAlignmentRole(newInput.newData)
			)
		})
	}

	removeRolesFromGame = (args: string[]) => {
		const indexes = args.map(arg => {
			if(!stringContainsOnlyDigits(arg)) return 'invalid'
			const index = parseInt(arg) ? (parseInt(arg)-1) : 'invalid';
			if(index < this.rolePool.length) 
				return index;
			return 'invalid'
		});

		if(arrayContainsElement(indexes,'invalid')) return;
		const rolesToRemove = indexes.map((index:number) => this.rolePool[index].id);
		this.rolePool = this.rolePool.filter(({id}) => !rolesToRemove.includes(id));
	}

	addRolesToGame = (args: string[]) => {
		const roleInputs = args
		roleInputs.map((input)=>{
			const inputElements = input.split(' ');
			if(inputElements.length > 3) return
			const roleQuantity = parseInt(input[0]) || 1;
			const roleString = inputElements.slice(1).join(' ') || input
			this.addRoleToGame(roleString, roleQuantity);
		})
	}

	addRoleToGame = (roleInput:string, roleQuantity: number) => {
		const status = this.pushAlignmentRole(roleInput, roleQuantity);
		!status&& this.pushSpecificRole(roleInput, roleQuantity);
	} 

	findSpecificRole = (input: string):RolePoolElement =>{
		const inputs = input.split(' ').map(word=>word.toLowerCase());
		if(inputs.length!==1)return null
		const nameResult = getStringSearchResults(this.salemRoleNames,input);
		if(nameResult.length===0)return null
		const roleName = nameResult[0];
		const role = this.salemRoles.find((role)=>role.name===roleName);
		return ({
			id: uniqueId(),
			name: role.name,
			type: role.type,
			alignment: role.alignment,
		})
	}

	pushSpecificRole = (input: string, roleQuantity:number) =>{
		const role = this.findSpecificRole(input);
		if(!role) return false
		
		for(let i=0;i<roleQuantity;i++)
		this.rolePool.push(role)

		return true
	}

	findAlignmentRole = (input:string): RolePoolElement =>{
		const inputs = input.split(' ').map(word=>word.toLowerCase());
		if(inputs.length===0 || inputs.length>2) return null

		const alignmentInput: string = inputs[0];
		const typeInput: string | undefined | null = inputs[1];

		const alignmentResult = getStringSearchResults(this.salemRoleAlignment,alignmentInput);
		if(alignmentResult.length===0) return null
		const roleAlignment = this.salemRoleAlignment.find((a)=>a===alignmentResult[0]);

		const typeResult = typeInput ? getStringSearchResults(this.salemRoleTypes,typeInput) : [];
		const roleType = typeResult[0] ? this.salemRoleTypes.find((a)=>a===typeResult[0]) : 'Random';
	
		return ({
			id: uniqueId(),
			name: 'Random',
			type: roleType,
			alignment: roleAlignment,
		})
	}

	pushAlignmentRole = (input:string, roleQuantity:number) =>{
		const role = this.findAlignmentRole(input)
		if(!role) return false

		for(let i=0;i<roleQuantity;i++)
			this.rolePool.push(role)

		return true
	}

}