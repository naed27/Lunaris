import { GuildMember, Message, TextChannel }  from 'discord.js';
import ChannelManager from './channelManager';
import Game from './game';

interface ConstructorParams{
  channel:TextChannel,
  discord:GuildMember,
  game:Game
}

export default class PlayerChannelManager extends ChannelManager{

  readonly discord:GuildMember
    
  constructor({ channel, discord, game }: ConstructorParams){

    super({ 
      game: game,
      channel: channel,
      defaultId: discord.id, 
    });

  }

  //  --------------------- functions ---------------------


  listen = () =>{
    const filter = (m:Message) => m.author.id === this.discord.id;
    const collector = this.channel.createMessageCollector({filter});

    collector.on('collect',async (m)=>{
        if(this.game.getClock().getPhase().name === 'Question')return
        const message = m.content;
    })
  }
  
}