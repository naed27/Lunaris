import { Message, MessageEmbed, MessagePayload, TextChannel }  from 'discord.js';
import Player from '../../player'
import PlayerChannelManager from '../playerChannelManager';

interface ReactCollector {
  (manager:MessageManager):Promise<void>|void
}

export default class MessageManager{

  readonly player: Player;
  readonly channelManager: PlayerChannelManager;
  readonly channel: TextChannel;

  message: Message | null;
  page = 0;
    
  constructor(playerChannelManager: PlayerChannelManager){
    this.channelManager = playerChannelManager;
    this.player = playerChannelManager.getPlayer();
    this.channel = playerChannelManager.getChannel();
  }
  
  getMessage = () => this.message;
  setMessage = (a:Message) => this.message = a;
  editMessage = (a:MessagePayload) => this.message.edit(a);
  applyReactCollect = (collect: ReactCollector) => collect(this);

  create = async (a:MessagePayload) => {
    this.delete();
    this.page = 1;
    this.message = await this.channel.send(a).catch();
  }

  delete = () => { 
    this.message && this.message.delete(); 
    this.message = null
    this.page = 0;
  };

  getPage = () => this.page;
  setPage = (a:number) => this.page = a;

}