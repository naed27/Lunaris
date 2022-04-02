import { Message, MessageActionRow, MessageEmbed, MessageOptions, MessagePayload, TextChannel }  from 'discord.js';
import Game from '../../game';
import Player from '../../player'
import PlayerChannelManager from '../playerChannelManager';
import { ReactCollector } from './collectors';

interface CardGenerator{
  ({messageManager}:{messageManager:MessageManager}): MessageEmbed | null
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
  readonly linebreak = `‎\n`;

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
  applyReactionCollector = (collector: ReactCollector) => collector({messageManager:this});
  removeInteractionCollector = async () => this.message && await this.edit({embeds:[this.cardGenerator({messageManager:this})], components:[]}).catch(()=> console.log( 'Error: Could not edit message' ));
  generateEmbed = (embed?: MessageEmbed) => embed ? embed : this.cardGenerator({messageManager:this})

  create = async (messageEmbed?: MessageEmbed ) => {
    this.delete();
    this.page = 1;
    const embed = this.generateEmbed(messageEmbed);
    const embedArray = embed === null ? [] : [embed]
    this.message = await this.channel.send({content: this.linebreak,embeds:embedArray}).catch(() => console.log( 'Error: Could not delete message' )); 
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
  setPage = (a:number) => {
    if(a > this.maxPage || a < this.minPage) return;
    this.page = a;
    this.update();
  }

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
    const embedArray = embed === null ? [] : [embed]
    this.message && await this.edit({ embeds:embedArray }).catch(() => console.log( 'Error: Could not edit message' ));
  }

  edit = async (a:MessageOptions | string) => {
    if(!this.message) return
    const payload: MessageOptions = 
      typeof a === 'string' ? 
      {content:`${this.linebreak}${a}`} :
      {...a, content:`${this.linebreak}`}
    return await this.message.edit(payload).catch(() => console.log( 'Error: Could not edit message' ));
  }

  editChoices = async (components:MessageActionRow[] ) => {
    if(!this.message) return
    return await this.message.edit({components:[...components]}).catch(() => console.log( 'Error: Could not edit message' ));
  }

}