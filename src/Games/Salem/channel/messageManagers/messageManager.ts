import { Message, MessageEmbed, MessagePayload, TextChannel }  from 'discord.js';
import Game from '../../game';
import Player from '../../player'
import PlayerChannelManager from '../playerChannelManager';

interface ReactCollector {
  (manager:MessageManager):Promise<void>|void
}

interface ConstructorParams{
  channel: PlayerChannelManager
  generator:{({messageManager}:{messageManager:MessageManager}): MessageEmbed};
}

export default class MessageManager{

  readonly game: Game
  readonly player: Player;
  readonly channelManager: PlayerChannelManager;
  readonly channel: TextChannel;

  message: Message | null;
  page = 0;
  minPage = 1;
  maxPage = 1;
  cardGenerator:{({messageManager}:{messageManager:MessageManager}): MessageEmbed};
    
  constructor({channel, generator}:ConstructorParams){
    this.channelManager = channel;

    this.cardGenerator = generator;
    this.game = channel.getGame();
    this.player = channel.getPlayer();
    this.channel = channel.getChannel();
  }
  
  getGame = () => this.game;
  getPlayer = () => this.player;
  getMessage = () => this.message;
  setMessage = (a:Message) => this.message = a;
  editMessage = (a:MessagePayload) => this.message.edit(a);
  applyReactionCollector = (collector: ReactCollector) => collector(this);

  create = async () => {
    this.delete();
    this.page = 1;
    const embed = this.cardGenerator({messageManager:this})
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
    this.updateMessage();
  };

  pageNext = () => {
    this.page<this.maxPage && this.page++;
    this.updateMessage();
  }

  updateMessage = () => {
    const embed = this.cardGenerator({messageManager:this})
    this.message.edit({embeds:[embed]})
  }
}