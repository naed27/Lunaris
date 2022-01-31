import { GuildMember, Message, MessageEmbed, TextChannel }  from 'discord.js';
import { createEmbed } from '../../../Helpers/toolbox';
import ChannelManager from './channelManager';
import Game from '../game';
import { Phase } from '../phases';

interface ConstructorParams{
  channel:TextChannel,
  game:Game
}

interface timerParams{
  currentPhase:Phase,
  secondsLeft:number
}

export default class StageChannelManager extends ChannelManager{

  timerMessageAddress: Message | null = null;
    
  constructor({channel,game}: ConstructorParams){
    
    super({ 
      game,
      channel,
      defaultId: game.getGameKey().id
    });

  }

  updateTimer = ({ currentPhase,secondsLeft }: timerParams) =>{
    if( this.timerMessageAddress === null )return;

    const description = `${currentPhase.name} - ${secondsLeft}`; 
    const embed = createEmbed({ description });
    
    this.timerMessageAddress.edit({ embeds: [embed] });
  }
  
}