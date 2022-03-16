import { RolePoolElement } from "./roles";
import roles, { SalemRole } from "./roles";
import Role from "./role";
import Player from "./player";
import { Guild, TextChannel, Collection, Message, Role as DiscordRole } from 'discord.js';
import Game from "./game";
import { createEmbed, shuffleArray } from "../../Helpers/toolbox";

export default class Setup{

  game: Game;
  guild: Guild;
  gameChannel: TextChannel;

  constructor( game: Game ){
    this.game = game;
    this.guild = game.getGuild();
  }

  
  determineRolePool = (rolePool: RolePoolElement[]) => {
    const rolledPool: SalemRole[] = [];

    for(let i=0; i<rolePool.length; i++){
      let roleFilter = roles;
      if(rolePool[i].alignment !== 'Random'){
        roleFilter = roleFilter.filter(r => r.alignment === rolePool[i].alignment);
        if(rolePool[i].type !== 'Random'){
          roleFilter = roleFilter.filter(r => r.type === rolePool[i].type);
          if(rolePool[i].name !== 'Random'){
            roleFilter = roleFilter.filter(r => r.name === rolePool[i].name);
          }
        }
      }

      const rngStart = 0;
      const rngEnd = roleFilter.length-1;
      const rngChosenIndex = Math.floor((Math.random() * rngEnd) + rngStart);
      const pickedRoled = roleFilter[rngChosenIndex];
      if(pickedRoled.unique){
        const roleAlreadyExists = rolledPool.find((r)=>r.name === pickedRoled.name);
        if(roleAlreadyExists) i--;
        else rolledPool.push(pickedRoled);
      }else{
        rolledPool.push(pickedRoled);
      }
    }

    return rolledPool;
  }

  setupPlayers = async () => {

    const rolePool = this.game.getHost().getRolePool();
    const rolledRoles = shuffleArray( this.determineRolePool(rolePool) );
    const players = shuffleArray( this.game.getHost().getJoinedPlayers() );

    for(let i=0; i<rolledRoles.length; i++){
      const channel = await this.createPrivateChannel();
      this.game.connectPlayer(new Player({
        listnumber: i+1,
        game: this.game,
        channel: channel,
        discord: players[i],
        role: new Role(rolledRoles[i]),
      }));
    }
  }

  createPrivateChannel = async () => {
    const guild = this.game.getGuild();
    return await guild.channels.create(`🌹﹕salem`, {
      type: 'GUILD_TEXT',
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ],
    })
  }

  createGameRole = async () => {
    const guild = this.game.getGuild();
    const gameRole = await guild.roles.create({
      name: 'Salem',
      color: '#0f0f0f',
      permissions:[]
    });
    this.game.setGameKey(gameRole);
  }

  distributeGameRole = async () =>{
    if( !this.game.getGameKey() ) return
    for( const player of this.game.getPlayers() ){
      await player.getDiscord().roles.add( this.game.getGameKey() )
    }
  }

  calculateJudgements = async () => {
    const chosens= [];
    let guiltyCount=0;
    let innoCount=0;

    this.game.getAlivePlayers().map((player)=>{
      const playerJudgement = player.getJudgement()
      switch(playerJudgement){
        case 'Guilty': guiltyCount++; chosens.push(`${player.getUsername()} has voted **${playerJudgement}**`); break;
        case 'Innocent': innoCount++; chosens.push(`${player.getUsername()} has voted **${playerJudgement}**`); break;
        case 'Abstain': chosens.push(`${player.getUsername()} has **Abstained**`); break;
      }
    })

    const finalString = chosens.join('\n') + `\n\nGuilty: ${guiltyCount}\nInnocent: ${innoCount}`;
    const embed = createEmbed({ description:finalString });
    this.game.getPlayers().map( async ( p ) => {
      await p.getChannelManager().manageJudgement().removeInteractionCollector();
      await p.getChannelManager().manageJudgement().update(embed)
    });

    if(guiltyCount>innoCount)
      return true;
    return false;
  }

  setupExeTarget = async () => {
    const executioner = this.game.getPlayers().find(p=>p.getRole().getName()=="Executioner");
    if(!executioner)return

    const townies = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Town");
    const target = shuffleArray(townies)[0];
    executioner.setExecutionerTarget(target);
  }

  listenHouseChannel = async () => {
    const phase = this.game.getClock().getPhase().name;
    if(phase !== 'Discussion' && phase !== 'Night') return 
    this.game.getPlayers().map(player => {
      player.cleanHelpers();
      if(player.isJailed())return
      player.getChannelManager().managePhaseCommands().create();
    });
  }

  cleanChannel = async (channel: TextChannel) => {
    let fetched: Collection<string, Message<boolean>>;
    do {
      fetched = await channel.messages.fetch({limit: 100});
      await channel.bulkDelete(fetched);
    }
    while(fetched.size >= 2);
  }

  activatePlayerListeners = async () => {
    this.game.getPlayers().map(p => p.getChannelManager().listen())
  };

  

}
