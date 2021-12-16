import { Message, TextChannel }  from 'discord.js';
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

    isLocked: boolean ;
    isHidden: boolean ;

    constructor({channel,defaultId,game}:ConstructorParams){
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

    showAndUnlock = ( id:string=this.defaultId )=>{
        this.channel.permissionOverwrites.edit(id,{
            SEND_MESSAGES:true,
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true 
        })
    }
    
    hideAndLock = ( id:string=this.defaultId ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    unlock = ( id:string=this.defaultId ) =>{
        if(!this.isLocked)return
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:true,
        });
        this.isLocked = false;
    }

    lock = ( id:string=this.defaultId ) =>{
        if(this.isLocked)return
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
        });
        this.isLocked = true;
    }

    hide = ( id:string=this.defaultId ) =>{
        if(this.isHidden)return
        this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
        this.isHidden = true;
    }

    show = ( id:string=this.defaultId ) =>{
        if(!this.isHidden)return
        this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true,
        });
        this.isHidden = false;
    }
}