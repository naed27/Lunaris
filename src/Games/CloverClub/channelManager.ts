import { GuildMember, Message, TextChannel }  from 'discord.js';
import Game from './game';

interface ConstructorParams{
    channel:TextChannel,
    discord:GuildMember,
    game:Game
}

export default class ChannelManager{
    
    readonly channel:TextChannel;
    readonly discord:GuildMember;
    readonly game:Game;

    constructor({channel,discord,game}:ConstructorParams){
        this.channel = channel;
        this.discord = discord;
        this.game = game;
    }

    //  --------------------- functions ---------------------

    showAndUnlock = ( id:string=this.discord.id )=>{
        this.channel.permissionOverwrites.edit(id,{
            SEND_MESSAGES:true,
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true 
        })
    }
    
    hideAndLock = ( id:string=this.discord.id ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    unlock = ( id:string=this.discord.id ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:true,
        });
    }

    lock = ( id:string=this.discord.id ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            SEND_MESSAGES:false,
        });
    }

    hide = ( id:string=this.discord.id ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    show = ( id:string=this.discord.id ) =>{
        this.channel.permissionOverwrites.edit(id,{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true,
        });
    }


    listen = () =>{
        const filter = (m:Message) => m.author.id === this.discord.id;
        const collector = this.channel.createMessageCollector({filter});

        collector.on('collect',async (m)=>{
            if(this.game.getPhase() !== 'can talk')return
            const message = m.content;
        })
    }
    
}