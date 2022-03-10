import roles from './roles';
import Role from './role';
import { Collection, Message, MessageReaction, TextChannel, User } from 'discord.js';
import Game from './game';
import { jsonWrap, delay, stringStartsWithKeyword, stringContainsKeyword, stringContainsInitials } from '../../Helpers/toolbox';
import Player from './player';
import { judgement as judgementCollector } from './channel/messageManagers/collectors';

export default class Functions{

  game: Game;

  constructor(game: Game){
    this.game = game;
  }

  setupJudgements = () => this.game.getPlayers(). map((p)=>{
    const judgement = p.getChannelManager().manageJudgement();
    judgement.create();
    judgement.applyReactionCollector(judgementCollector)
  });

  sendMarkDownToPlayers = async (message: string, secondsDelay: number = 0) =>{
    this.messagePlayers(jsonWrap(message));
    return await delay(secondsDelay);
  }

  gameOverMessage = async (message: string) => {
    this.game.getPlayers().map(async (player)=>{
      const address = await player.getChannelManager().send(message);
      address.react('🚪');
      const filter = (reaction:MessageReaction, user:User) => !user.bot;
      const collector = address.createReactionCollector({filter});
      collector.on('collect', async (reaction: MessageReaction) => {
        const react = reaction.emoji.name;
        if(react!== '🚪')return
        const discord = this.game.getGuild().members.cache.find(m => m.id === player.getId());
        discord.roles.remove(this.game.getGameKey());
        player.getChannelManager().hideAndLock();
      });
    });
  }

  messagePlayers = async (a:string) => this.game.getPlayers().map((p)=>p.getChannelManager().send(a))

  messageGhosts = async (message: string) => {
    this.game.getPlayers().map((p)=>p.getStatus()=='Dead' && p.getChannelManager().send(message))
  }

  messagePlayersWrapped = async (message: string) => {
    const content = jsonWrap(message);
    this.game.getPlayers().map((p)=>p.getChannelManager().send(content));
  }

  cleanChannel = async (channel: TextChannel) => {
    let fetched: Collection<string, Message<boolean>>;
    do {
      fetched = await channel.messages.fetch({limit: 100});
      await channel.bulkDelete(fetched);
    }
    while(fetched.size >= 2);
  }

  stringifyWinners = () => {
    const string = 'End Results:\n\n';
    const results = this.game.getPlayers().map(player => {
      const discord = player.getDiscord().user.username;
      const username = player.getUsername();
      const role = player.getRole().getName();
      const isWinner = player.getWinStatus() ? ` (Victorious)` : ``;
      return `${username} - ${discord} - ${role} ${isWinner}`;
    }).join('\n');
    return string+results;
  }

  messageMafias = (message: string) => {
    const mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=='Mafia');
    mafias.map((mafia) => mafia.getChannelManager().send(message));
  }

  messageOtherMafias = (message: string, sender: Player) => {
    const content = jsonWrap(message);
    const mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=='Mafia' && p.getUsername()!=sender.getUsername());
    mafias.map((mafia)=>mafia.getChannelManager().send(content))
  }

  playerWithRoleIsAlive = (role: string) => {
    if(this.game.getPlayers().filter(p=>p.getRole().getName()==role && p.getStatus()=='Alive').length>0)
      return true;
    return false;
  }

  roleExistsInActions = (roleName: string) => {
    if(this.game.getActions().filter(a=>a.getUser().getRole().getName()==roleName).length>0)
      return true;
    return false;
  }

  getActionOfTheRole = (roleName: string) => {
    return this.game.getActions().find(a=>a.getUser().getRole().getName()==roleName);
  }

  promoteAGodfather = async () =>{
    if(this.game.roleExists('Godfather')) return

    const mafias = this.game.getAliveMafias();
    if(mafias.length === 0) return

    const godFatherRole = roles.find(r=>r.name === 'Godfather');
    const promotee = mafias.length>1 ? mafias.find(m=> m.getRoleName() === 'Mafioso') : mafias[0];
    
    promotee.setRole(new Role(godFatherRole));
    await delay(1000);
    const notif = jsonWrap(`${promotee.getUsername()} has been promoted to Godfather!`);
    this.messageMafias(notif);
    this.promoteAMafioso();
  }

  promoteAMafioso = async () => {
    if(this.game.roleExists('Mafioso')) return

    const subordinates = this.game.getAliveMafias().filter((m) => m.getRoleName() !== 'Godfather');
    if(subordinates.length === 0) return
    
    const promotee = subordinates[0];
    const mafiosoRole = roles.find( r => r.name === 'Mafioso' );
    promotee.setRole( new Role( mafiosoRole ) );
    await delay(1000);
    const notif = jsonWrap( `${promotee.getUsername()} has been promoted to Mafioso!` );
    this.messageMafias( notif );
  }

  searchPlayerInChoices = (players:Player[], keyword: string) =>{
    if(keyword === '') return []

    const keysFound: Player[] = [];
    const startWiths: Player[] = [];
    const initialsFound: Player[] = [];
    const listNumberFound: Player[] = [];
   
    players.map((player)=>{
      const username = player.getUsername();
      const listNumber = player.getListNumber();

      if(listNumber === keyword) return listNumberFound.push(player);
      if(stringContainsKeyword(username,keyword))return keysFound.push(player)
      if(stringStartsWithKeyword(username,keyword))return startWiths.push(player)
      if(stringContainsInitials(username,keyword))return initialsFound.push(player)
    })

    if(listNumberFound.length>0) return listNumberFound;
    if(startWiths.length>0)return startWiths
    if(keysFound.length>0)return keysFound
    if(initialsFound.length>0)return initialsFound

    return [];
  }
}

