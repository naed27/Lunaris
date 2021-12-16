import { MessageEmbed, User, TextChannel, Message, GuildMember } from 'discord.js';
import Game from './game';
import PlayerChannelManager from './playerChannelManager';

export default class Player{

  readonly game:Game;
  readonly discord:GuildMember;
  readonly channel:TextChannel;
  readonly channelManager:PlayerChannelManager;
  readonly points = 0;

  constructor(game:Game,discord:GuildMember,channel:TextChannel){

    this.game = game;
    this.discord = discord;
    this.channel = channel;
    this.channelManager = new PlayerChannelManager({channel,discord,game});

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
