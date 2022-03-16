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
        }).catch(()=>console.log( 'Error: Could not show and unlock channel' ));
    }
    
    hideAndLock = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        }).catch(()=> console.log( 'Error: Could not hide and lock channel' ));
    }

    unlock = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:true,
        }).catch(()=> console.log( 'Error: Could not unlock channel' ));
    }

    lock = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
        }).catch(()=> console.log( 'Error: Could not lock channel' ));
    }

    hide = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        }).catch(()=> console.log( 'Error: Could not hide channel' ));
    }

    show = async ( id:string=this.defaultId ) =>{
        return await this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true,
        }).catch(()=> console.log( 'Error: Could not show channel' ));
    }
    
    sendString = async (a: string | MessagePayload | MessageOptions) => {
        const linebreak = `‎`;
        return await this.channel
        .send(`${linebreak}${a}`)
        .catch(()=> console.log( 'Error: Could not send string message to discord' ));
    }
    send = async (a: string | MessagePayload | MessageOptions) => await this.channel
    .send(a)
    .catch(()=> console.log( 'Error: Could not send message to discord' ));
}