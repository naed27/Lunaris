import { Message, MessageEmbed, MessagePayload, TextChannel }  from 'discord.js';
import Game from '../../game';
import Player from '../../player'
import PlayerChannelManager from '../playerChannelManager';
import { ReactCollector } from './collectors';

interface CardGenerator{
  ({messageManager}:{messageManager:MessageManager}): MessageEmbed
};

interface ConstructorParams{
  generator: CardGenerator
  channelManager: PlayerChannelManager
}

export default class MessageManager{

  readonly game: Game
  readonly player: Player;
  readonly channelManager: PlayerChannelManager;
  readonly channel: TextChannel;

  message: Message | null = null;
  page = 0;
  minPage = 1;
  maxPage = 1;
  cardGenerator: CardGenerator;
    
  constructor({channelManager, generator}:ConstructorParams){
    this.channelManager = channelManager;
    this.cardGenerator = generator;
    this.game = channelManager.getGame();
    this.player = channelManager.getPlayer();
    this.channel = channelManager.getChannel();
  }
  
  getGame = () => this.game;
  getPlayer = () => this.player;
  getMessage = () => this.message;
  setMessage = (a:Message) => this.message = a;
  editMessage = (a:MessagePayload) => this.message.edit(a);
  applyReactionCollector = (collector: ReactCollector) => collector({messageManager:this});

  create = async (messageEmbed: MessageEmbed = null) => {
    this.delete();
    this.page = 1;
    const embed = messageEmbed === null ? this.cardGenerator({messageManager:this}) : messageEmbed
    this.message = await this.channel.send({embeds:[embed]})
  }

  delete = () => { 
    this.message && this.message.delete(); 
    this.message = null
    this.page = 0;
  };

  getPage = () => this.page;
  setPage = (a:number) => this.page = a;

  getMaxPage = () => this.maxPage;
  setMaxPage = (a:number) => this.maxPage = a;

  pagePrev = () => {
    this.page>this.minPage && this.page--
    this.update();
  };

  pageNext = () => {
    this.page<this.maxPage && this.page++;
    this.update();
  }

  update = (messageEmbed: MessageEmbed = null) => {
    if(this.message === null || this.message === undefined) return this.create()
    const embed = messageEmbed === null ? this.cardGenerator({messageManager:this}) : messageEmbed
    this.message.edit({embeds:[embed]});
  }
}