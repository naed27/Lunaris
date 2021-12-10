import { MessageEmbed, User, TextChannel, Message, GuildMember } from 'discord.js';
import Game from './game';
import ChannelManager from './channelManager';

export default class Player{

  readonly game:Game;
  readonly discord:GuildMember;
  readonly channel:TextChannel;
  readonly channelManager:ChannelManager;
  readonly points = 0;

  constructor(game:Game,discord:GuildMember,channel:TextChannel){

    this.game = game;
    this.discord = discord;
    this.channel = channel;
    this.channelManager = new ChannelManager({channel,discord,game});

  }

  // ----------------------- Functions 



  // ----------------------- Setters and Getters  

  
  getId = () => this.discord.id

  getUsername = () => this.discord.user.username

  getDiscord = () => this.discord

  getChannel = ()=> this.channel

  getChannelManager = () => this.channelManager

  getPoints = () => this.points
}
