import { MessagePayload, TextChannel, MessageOptions }  from 'discord.js';
import Game from '../game';

interface ConstructorParams{
    channel:TextChannel,
    defaultId:string,
    game:Game
}

export default class ChannelManager{
    
    readonly channel:TextChannel;
    readonly defaultId:string;
    readonly game:Game;
    constructor({channel,defaultId,game}:ConstructorParams){
        this.game = game;
        this.channel = channel;
        this.defaultId = defaultId;
    }

    //  --------------------- Getters 

    getGame = () => this.game;
    getChannel = () => this.channel;
    getDefaultId = () => this.defaultId;

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
        const isLocked = this.channel.permissionsFor(id).has('SEND_MESSAGES');
        if(!isLocked)return
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:true,
        });
    }

    lock = async ( id:string=this.defaultId ) =>{
        const isLocked = this.channel.permissionsFor(id).has('SEND_MESSAGES');
        if(isLocked)return
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
        });
    }

    hide = async ( id:string=this.defaultId ) =>{
        const isHidden = this.channel.permissionsFor(id).has('VIEW_CHANNEL');
        if(isHidden)return
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    show = async ( id:string=this.defaultId ) =>{
        const isHidden = this.channel.permissionsFor(id).has('SEND_MESSAGES');
        if(!isHidden)return
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true,
        });
    }

    send = async (a: string | MessagePayload | MessageOptions) => await this.channel.send(a);
}