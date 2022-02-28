import sampleRolePool, { RolePoolElement } from "./modes";
import roles, { SalemRole } from "./roles";
import Role from "./role";
import Player from "./player";
import { Guild, TextChannel, Collection, Message } from 'discord.js';
import Game from "./game";
import { shuffleArray } from "../../Helpers/toolbox";

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
      const startRange = 0;
      const endRange = roleFilter.length-1;
      const rngIndex = Math.floor((Math.random() * endRange) + startRange);
      const pickedRoled = roleFilter[rngIndex];
      if(pickedRoled.unique){
        const roleAlreadyExists = rolePool.find((r)=>r.name === pickedRoled.name);
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

    rolledRoles.map( async (role, i)=>{
      const channel = await this.createChannel();
      const player = new Player({
        game: this.game,
        discord: players[i],
        channel: channel,
        role: new Role(role),
        listnumber: i+1
      });

      this.game.connectPlayer(player);
    });
  }

  createChannel = async () => {
    const guild = this.game.getGuild();

    const channel = await guild.channels.create(`🌹﹕salem`, {
      type: 'GUILD_TEXT',
      permissionOverwrites: [
        {
          id: guild.roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        },
      ],
    })

    return channel
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

  distributeGameRole = () =>{
    this.game.getPlayers().map(player => player.getDiscord().roles.add( this.game.getGameKey() ));
  }

  calculateJudgements = async () => {
    const chosens= [];
    let guiltyCount=0;
    let innoCount=0;

    this.game.getJudgements().filter(j => j.final).map(j => {
      switch(j.choice){
        case 'Guilty': guiltyCount++; chosens.push(`${j.judge.getUsername()} has voted **${j.choice}**`); break;
        case 'Innocent': innoCount++; chosens.push(`${j.judge.getUsername()} has voted **${j.choice}**`); break;
        case 'Abstain': chosens.push(`${j.judge.getUsername()} has abstained`); break;
      }
    })

    const finalString = chosens.join('\n') + `\n\nGuilty: ${guiltyCount}\nInnocent: ${innoCount}`;
    this.game.getPlayers().map(( p ) => p.getChannelManager().manageJudgement().update());

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


  setupPlayerCollectors = async () => this.game.getPlayers().map(p => p.getChannelManager().listen());
  lockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().lock());
  unlockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().unlock());
  showPlayerChannels = async () => this.game.getPlayers().map(async p => p.getChannelManager().show(p.getId()));

}
