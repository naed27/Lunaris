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

  message: Message | null | void = null;
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
  editMessage = async (a:MessagePayload) => this.message && await this.message.edit(a).catch(()=> console.log( 'Error: Could not edit message' ));
  applyReactionCollector = (collector: ReactCollector) => collector({messageManager:this});
  removeInteractionCollector = async () => this.message && await this.message.edit({embeds:[this.cardGenerator({messageManager:this})], components:[]}).catch(()=> console.log( 'Error: Could not edit message' ));
  generateEmbed = (embed?: MessageEmbed) => embed ? embed : this.cardGenerator({messageManager:this})

  create = async (messageEmbed?: MessageEmbed ) => {
    this.delete();
    this.page = 1;
    const embed = this.generateEmbed(messageEmbed);
    this.message = await this.channel.send({embeds:[embed]}).catch(() => console.log( 'Error: Could not delete message' )); 
  }

  delete = async () => { 
    this.message && await this.message.delete().catch(() => console.log( 'Error: Could not delete message' )); 
    this.clearCache();
  };

  clearCache = () => {
    this.message = null
    this.page = 0;
  }

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

  update = async (messageEmbed?: MessageEmbed) => {
    if(this.message === null || this.message === undefined) return await this.create()
    const embed = messageEmbed ? messageEmbed : this.cardGenerator({messageManager:this})
    this.message && await this.message.edit({embeds:[embed]}).catch(() => console.log( 'Error: Could not edit message' ));
  }
}