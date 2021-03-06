import { GuildMember, TextChannel, Guild, User, Message, ReactionCollector, MessageReaction, MessageEmbed } from 'discord.js';
import { createEmbed } from '../../Helpers/toolbox';
import Game from './game';

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

  gameTitle:string;
  gameInvite: Message;
  reactCollector: ReactionCollector;

  goFlag = `standby`;
  minimumRequiredPlayers = 2;
  maximumNumberOfPlayers = 5;

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

  async sendGameInvite({channel, summoner}: {channel: TextChannel, summoner: User}){

    const embed = createEmbed({description:'Loading...'});
    const gameInvite = await channel.send({embeds:[embed]});
    this.gameInvite = gameInvite;
    await this.updatePlayerList();

    const reactionFilter = (reaction:MessageReaction, user:User) => !user.bot;
    const reactCollector = gameInvite.createReactionCollector({filter:reactionFilter, time: 180000, dispose:true });
    this.reactCollector = reactCollector;

    reactCollector.on('collect', async (reaction, user) => {
        
      const reactionName = reaction.emoji.name;

      if(reactionName=="🚪") return this.addPlayer(user);
      if(reactionName=="▶️") return this.activateGoFlag(user);
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
      if(this.goFlag===`start`) return this.beginGame();
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
  }

  editHostMessage = async(embed:MessageEmbed) => this.gameInvite.edit({embeds:[embed]})

  activateGoFlag = ( user:User) =>{
    if(!this.isHost(user)) return
    if(this.joinedPlayers.length<this.minimumRequiredPlayers) return
    this.goFlag='start';
    return this.reactCollector.stop();
  }

  beginGame = async() => {
    this.goFlag = `done`;
    const title = this.gameTitle;
    const players = this.joinedPlayers.map(p => `- ${p.user.username}`).join("\n");
    const description = `Players:\n\n${players}`;
    const footer = `Loading up the game. Please wait...`;
    
    const embed = createEmbed({ title,description,footer });
    this.gameInvite.reactions.removeAll();
    this.gameInvite.edit({embeds:[embed]});
    this.game.setupGame();
  }

  addPlayer = async ( user:User ) => {
    if( this.joinedPlayers.length >= this.maximumNumberOfPlayers ) return
    const player = this.game.getGuild().members.cache.get(user.id);
    if( !this.isNewPlayer(player) ) return 
    this.joinedPlayers.push( player );
    this.updatePlayerList();
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
    const player_list = this.joinedPlayers.map(p => `- ${p.user.username}`).join('\n');
    const description = `Players:\n${player_list}\n\nClick the 🚪 to join.`
    const footer = `Hosted by: ${this.host.username}`;
    const embed = createEmbed({ title,description,footer });
    await this.editHostMessage(embed);
  }

  async notifyGameStart(){
    const playerList = this.joinedPlayers.map(p => `- ${p.user.username}`).join("\n");
    const title = this.gameTitle;
    const description = `Players:\n\n${playerList}`;
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

}
