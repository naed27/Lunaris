import { MessagePayload, TextChannel, MessageOptions }  from 'discord.js';
import Game from '../game';

interface ConstructorParams{
    channel: TextChannel,
    defaultId: string,
    game: Game
}

export default class ChannelManager{

    readonly game: Game;
    readonly defaultId: string;
    readonly channel: TextChannel;

    isLocked: boolean ;
    isHidden: boolean ;

    constructor({channel, defaultId, game}:ConstructorParams){
        this.game = game;
        this.channel = channel;
        this.defaultId = defaultId;
        this.isLocked = channel.permissionsFor(defaultId).has('SEND_MESSAGES');
        this.isHidden = channel.permissionsFor(defaultId).has('VIEW_CHANNEL');
    }

    //  --------------------- Getters 

    getGame = () => this.game;
    getChannel = () => this.channel;
    getDefaultId = () => this.defaultId

    //  --------------------- Functions

    showAndUnlock = async ( id:string=this.defaultId )=>{
        return await this.channel.permissionOverwrites.edit(id,{
            SEND_MESSAGES:true,
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true 
        })
    }
    
    hideAndLock = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    unlock = async ( id:string=this.defaultId ) =>{
        if(!this.isLocked)return
        this.isLocked = false;
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:true,
        });
    }

    lock = async ( id:string=this.defaultId ) =>{
        if(this.isLocked)return
        this.isLocked = true;
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
        });
    }

    hide = async ( id:string=this.defaultId ) =>{
        if(this.isHidden)return
        this.isHidden = true;
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    show = async ( id:string=this.defaultId ) =>{
        if(!this.isHidden)return
        this.isHidden = false;
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true,
        });
    }

    send = async (a: string | MessagePayload | MessageOptions) => await this.channel.send(a);
}