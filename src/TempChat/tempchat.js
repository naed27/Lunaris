
const {MessageEmbed} = require('discord.js');
const util = require("../Essentials/utility");
class ChatBox{
    
  
    channel_id;
    chatHostId;
    chatbox=[];
    chatBox_embed;
    chatBox_id;
    chatCollector;
    db;

     constructor(message,embed,address,chatCollector,filter,db,channel_id){
        this.db = db;
        this.channel_id=message.channel.id;
        this.chatHostId=message.author.id;
        this.chatBox_embed = embed
        this.chatBox_id = address;
        this.filter = filter;
        this.chatCollector = chatCollector;
    }
    pushChatBox(a){
        if(this.chatbox.length==7){
            this.chatbox=this.chatbox.slice(1);
        }
        this.chatbox.push(a);
    }

    collect(){
        try {
            let input="";
            this.chatCollector.on('collect', async m => {
                m.delete().catch(error => {});
                if(m.content=="$quit"&&m.author.id==this.chatHostId){
                    this.db.deleteChat(this.channel_id);
                    await this.chatCollector.stop();
                    await this.chatBox_id.delete();
                }else{
                    if(m.content.length<200){
                        let msgs = util.splitLineBreaks(m.content);
                        msgs.forEach(msg => {
                            input = `**${m.author.username}**: ${msg}`;
                            this.pushChatBox(input);
                        });
                        await this.updateChatbox(); 
                    }
                }
            });
        } catch (err) {
            console.log("1");
        }
    }

    async updateChatbox(){
        try {
            let chat_String="";
            let start=0;
            for(let i=start;i<this.chatbox.length;i++){
                chat_String+=`${this.chatbox[i]}`;
                if(i<this.chatbox.length-1){
                    chat_String+=`\n`;
                }
            }
            this.chatBox_embed.setDescription(`${chat_String}`);
            await this.chatBox_id.edit(this.chatBox_embed);    
        } catch (err) {
            console.log("2");
        }
    }
}

module.exports = ChatBox;

