const util = require("../Essentials/utility");
const {MessageEmbed} = require('discord.js');
const dnd_characters = require("./characters");
const dnd_campaigns = require("./campaigns");
const dnd_message = require("./message");
const dnd_player = require("./player");
const { xgcd, zeros } = require("mathjs");

class gate_keeper{

    host_id;
    party=[];
    hosting_embed = new MessageEmbed();
    hosting_msg;
    goal;
    extras = 1;
    campaign;
    messages=[];
    mainChannel;
    chatChannel;
    settingsChannel;
    settingsPopUp;
    settingsCollectors=[];
    textColor="#000000";
    NPCs = [];

  
    
    constructor(m){
        this.host_id = m.author.id;
    }

   

    //--------------------------- HOSTING FUNCTIONS

    async chooseCampaign(message){
        let goFlag=false;
        let choices_String="";

        for(let i=0;i<dnd_campaigns.list.length;i++){
            choices_String+=`\n${i+1}. ${dnd_campaigns.list[i].Name}`;
            if(i!=dnd_campaigns.list.length){
                choices_String+=`\n`;
            }
        }
            
        this.hosting_embed
        .setColor(this.textColor)
        .setAuthor(`Available Campaigns:`)
        .setDescription(`${choices_String} `)
        .setFooter('choose a <number> to initiate. Type cancel to stop.');
        this.hosting_msg = await message.channel.send(this.hosting_embed);
        return new Promise((resolve, reject)=> {
            let choiceFilter = m => true;
            let choiceCollector = message.channel.createMessageCollector(choiceFilter,{time:180000});
            choiceCollector.on('collect', m => {
                m.delete();
                if(m.author.id === this.host_id&&m.content>0&&m.content<dnd_campaigns.list.length+1){
                    this.setCampaign(dnd_campaigns.list[m.content-1]);
                    this.setGoal(this.getCampaign().Characters.length);
                    this.setChatChannel(message.guild.channels.cache.get(this.getCampaign().ChatChannel.id));
                    this.setMainChannel(message.guild.channels.cache.get(this.getCampaign().MainChannel.id));
                    this.setSettingsChannel(message.guild.channels.cache.get(this.getCampaign().SettingsChannel.id));
                    let narrator = dnd_characters.list.filter(c => c.id === "901");
                    let npc = dnd_characters.list.filter(c => c.id === "902");
                    this.pushToParty(new dnd_player(this.getCampaign().Master.id,[narrator[0],npc[0]]));
                    this.pushNPC(narrator[0].name);
                    this.pushNPC(npc[0].name);
                    goFlag=true;
                    choiceCollector.stop();
                }else if(m.author.id === this.host_id&&m.content=="cancel"){
                    choiceCollector.stop();
                }
            });
            choiceCollector.on('end', collected => {
                if(!goFlag){
                    this.hosting_embed
                    .setAuthor(` `)
                    .setDescription(`Cancelled.`)
                    .setFooter(' ');
                    this.hosting_msg.edit(this.hosting_embed);
                    resolve(false);
                }else{
                   
                    resolve(true);
                }
            });
        });
    }

    async getMembers(message){
        let goFlag=false;
        let charaObjects=[];
        let charaList = ""
        for(let i=0;i<this.campaign.Characters.length;i++){
            let character = 
                {
                    id:i+1,
                    information:[
                        i+1+". ",
                        this.campaign.Characters[i].Name,
                        null
                    ],
                    get info(){
                        return this.information;
                    },
                    set newUser(a){
                        this.information[2]=a;
                    },
                }
            ;
            charaObjects.push(character);
            let charaString = character.info.join(" ");
            charaList+=`${charaString}\n`;
        }
        
        this.hosting_embed
        .setColor(this.textColor)
        .setAuthor(`${this.campaign.Name} has been initiated`)
        .setDescription(`Master:\n- ${this.campaign.Master.Name}\n\nCharacters:\n${charaList}`)
        .setFooter('Pick one character by typing "-use <list number>"');
        this.hosting_msg.edit(this.hosting_embed);
        await this.hosting_msg.react('▶️');
        this.hosting_msg.react('❌');
        
        let joinFilter = m => true;
        let memberCollector = message.channel.createMessageCollector(joinFilter);
        memberCollector.on('collect', m => {
            m.delete();
            if(!m.author.bot&&m.content.startsWith("-")){
                let args = util.exactString("-",m.content);
                const cmd = args[0];
                let choice = args[1];
                if(cmd==="use"&&choice>0&&choice<charaObjects.length+1){
                    let res = charaObjects.filter(c => c.id == choice);
                    if(res.length==1){
                        let character = dnd_characters.list.filter(c => c.Name === res[0].info[1]);
                        if(character.length==1){
                            let checker = this.joinPlayer(m.author.id,character[0]);
                            if(checker[0]){
                                if(checker[1]===2){
                                    let oldChar = charaObjects.filter(c => c.info[2] == `(<@${m.author.id}>)`);
                                    oldChar[0].information[2]=null;
                                }
                                res[0].information[2]=`(<@${m.author.id}>)`;
                                let member_list = this.updatePlayers(charaObjects);
                                this.editHostMessage(member_list);
                               
                            }
                        }
                    }
                }
            }
        });

        return new Promise((resolve, reject)=> {
            const filter = (reaction, user) => {return true;};
            let startCollector = this.hosting_msg.createReactionCollector(filter,{ time: 180000});
            startCollector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name=='▶️'&&user.id==this.host_id){
                    if(this.party.length==this.goal+this.extras){
                        goFlag=true;
                        startCollector.stop();
                        memberCollector.stop();
                    }else{
                        this.hosting_msg.reactions.resolve("▶️").users.remove(user.id);
                    }
                }else if(reaction.emoji.name=='❌'&&user.id==this.host_id){
                    startCollector.stop();
                    memberCollector.stop();
                }
            });
            startCollector.on('end', collected => {
                if(!goFlag){
                    this.hosting_embed
                    .setAuthor(` `)
                    .setDescription(`Cancelled.`)
                    .setFooter(' ');
                    this.hosting_msg.edit(this.hosting_embed);
                    resolve(false);
                }else{
                    this.hosting_embed
                    .setAuthor(`${this.campaign.Name}`)
                    .setFooter(' ');
                    this.hosting_msg.edit(this.hosting_embed);
                    resolve(true);
                }
                
            });
        });
    }

    joinPlayer(authorID,character){
        let type=0;
        if(this.getParty().length<=this.goal+this.extras){
            let hasAlreadyJoined =  this.checkDuplicate(authorID,character.Name);
            switch(hasAlreadyJoined){
                case 1: // user hasnt joined yet and chara is available
                    this.pushToParty(new dnd_player(authorID,[character]));   
                    type=1;    
                    return [true,type];
                case 2: // user joined but chara is available
                    let index = this.getParty().findIndex(m => m.id === authorID);
                    this.getParty().splice(index, 1);
                    this.pushToParty(new dnd_player(authorID,[character])); 
                    type=2; 
                    return [true,type];
                 case 3: // user hasnt joined yet but no chara available
                    type=3;
                    return [false,type];  
            }
        }
        return [false,type];
    }

    checkDuplicate(id,charName){
        let type=0;
        let user = this.getParty().filter(m => m.id === id);
        let chara = this.getParty().filter(m => m.getAvatar().Name === charName);
        if(user.length==0&&chara.length==0){
            type=1;
            return type;
        }else if(user.length==1&& chara.length==0){
            type=2;
            return type;
        }else if(user.length==0&& chara.length==1){
            type=3;
            return type;
        }
    }

    updatePlayers(array){
        let charaList ="";
        for(let i=0;i<array.length;i++){
            let charaString = array[i].info.join(" ");
            charaList+=`${charaString}\n`;
        }
        return charaList;
      }

    getJoinedPlayers(type){
        let member_array=[];
        let member_list="";
        for(let i=1; i<this.party.length;i++){
            if(type==="string"){
                member_list+=i+`. **${this.party[i].getCharacter().defName}** (<@${this.party[i].getID()}>)`;
              if(i!=this.party.length){
                member_list+=`\n`;
              } 
            }else if(type==="array"){
                member_array.push(this.party[i]);
            }
        }
          if(member_array.length==0){
            return member_list;
          }else{
            return member_array;
          }
      }

    editHostMessage(member_list){
        this.hosting_embed
        .setDescription(`Master:\n- ${this.campaign.Master.Name}\n\nCharacters:\n${member_list}`)
        this.hosting_msg.edit(this.hosting_embed);
    }

    //--------------------------- CHAT FUNCTIONS

    connectPlayers(message,party){
        let ingame = message.guild.roles.cache.find(role => role.id === this.getCampaign().Roles.campaign);
        let outgame = message.guild.roles.cache.find(role => role.id === this.getCampaign().Roles.base);
    
        this.setSettings(this.getSettingsChannel(),message);
        
        this.getParty().forEach(member => {
            let user = message.guild.members.cache.find(m => m.id === member.id);
            user.roles.add(ingame);
            user.roles.remove(outgame);
            this.getChatChannel().updateOverwrite(member.id,{ 
                VIEW_CHANNEL: true,
                SEND_MESSAGES:true,
                READ_MESSAGE_HISTORY:true 
            });
           
            let chatFilter = m => m.author.bot || m.author.id===member.id;
            member.setChatCollector(this.getChatChannel().createMessageCollector(chatFilter));
            member.getChatCollector().on('collect', async m => {
                if(m.author.id != "818019699979190313"){
                    await m.delete().catch(error => {});
                }
                if(!m.author.bot){
                    if(m.content.startsWith("-")){
                        let args = util.exactString("-",m.content);
                        const cmd = args[0];
                        if(cmd==="retype"){
                            let content = args[1];
                            let senderID = content.shift();
                            content = content.join(" ");
                            
                            if(senderID>0&&senderID<=this.getMessages().length){
                                let c = member.getAvatar();
                                let content1="";
                                let content2="";
                                let message = this.getMessages().filter(e => e.getID() == senderID && e.getAuthorID()==m.author.id);
                                if(!this.isAction(content)||this.isNarrator(m.author.id)){
                                    content1=`${c.tb}${c.sw}${c.e}[${message[0].getID()}] ${c.userName}${c.c}${c.e} ${content}${c.ew}${c.bb}`;
                                    content2=`${c.tb}${c.sw}${c.e}${c.userName}${c.c}${c.e} ${content}${c.ew}${c.bb}`;
                                }else{
                                    let actionMessage = this.actionProcessor(content,c.userName);
                                    content1=`${c.tb}${c.e}[${message[0].getID()}]${c.e} ${actionMessage}${c.bb}`;
                                    content2=`${c.tb}${actionMessage}${c.bb}`;
                                }
                                if(message.length===1){
                                message[0].getSubTargets().forEach(target => {
                                    target.edit(content1); 
                                });
                                message[0].getMainTarget().edit(content2);
                                }
                            }
                        }else if(cmd==="delete"){
                            let senderID = args[1].shift();
                            if(senderID>0&&senderID<=this.getMessages().length){
                                let message = this.getMessages().filter(e => e.getID() == senderID && e.getAuthorID()==m.author.id);
                                if(message.length===1){
                                    if(message[0].getStatus()==1){
                                        message[0].getSubTargets().forEach(target => {
                                            target.delete();
                                        });   
                                        message[0].getMainTarget().delete();
                                        message[0].setStatus(0);
                                        message[0].setSubTargets([]);
                                    }
                                }
                            }
                        }else if(cmd==="return"&&m.author.id=="481672943659909120"){
                            this.getParty().forEach(member => {
                                member.getChatCollector().stop();
                                let userr = message.guild.members.cache.find(m => m.id === member.id);
                                this.getChatChannel().updateOverwrite(member.id,{ 
                                    VIEW_CHANNEL: false,
                                    SEND_MESSAGES:false,
                                    READ_MESSAGE_HISTORY:false 
                                });
                                userr.roles.add(outgame);
                                userr.roles.remove(ingame);
                            });
                            this.closeSettings(this.getSettingsChannel());
                        }
               
                    }else{
                        let c = member.getAvatar();
                        let content1="";
                        let content2="";
                        let address;
                        if(!this.isAction(m.content)||this.isNarrator(m.author.id)){
                            content1=`${c.tb}${c.sw}${c.e}[${this.getMessages().length+1}] ${c.userName}${c.c}${c.e} ${m.content}${c.ew}${c.bb}`;
                            content2=`${c.tb}${c.sw}${c.e}${c.userName}${c.c}${c.e} ${m.content}${c.ew}${c.bb}`;
                        }else{
                            let actionMessage = this.actionProcessor(m.content,c.userName);
                            content1=`${c.tb}${c.e}[${this.getMessages().length+1}]${c.e} ${actionMessage}${c.bb}`;
                            content2=`${c.tb}${actionMessage}${c.bb}`;
                        }
                        this.getMessages().push(new dnd_message(this.getMessages().length+1,1,m.author.id));
                        
                        address = await this.getChatChannel().send(content1);
                        this.getMessages()[this.getMessages().length-1].pushSubTarget(address);
                       
                        address = await this.getMainChannel().send(content2);
                        this.getMessages()[this.getMessages().length-1].setMainTarget(address);
                    }
                }
            });
        });
    }

    isNPC(user_id){
        let res = this.getParty().filter(c => c.id == user_id);
        if(res.length>0){
            if(res[0].getAvatar().Name=="NPC"){
                return true;
            }else{
                return false;
            }
        }
    }

    isNarrator(user_id){
        let res = this.getParty().filter(c => c.id == user_id);
        if(res.length>0){
            if(res[0].getAvatar().Name=="Narrator"){
                return true;
            }else{
                return false;
            }
        }
    }

    isAction(content, sender){
        if(content.charAt(0)=="*"){
            return true;
        }else{
            return false;
        }
    }

    actionProcessor(content,sender){
        let nicknames = util.splitSpaces(sender);
        let w = content.slice(1,content.length);
        let words=util.splitSpaces(w);
        let startpoint=0;
        for(let i=0;i<nicknames.length;i++){
            for(let n=0;n<nicknames.length;n++){
                if(words[i].toLowerCase()==nicknames[n].toLowerCase()){
                    startpoint++;
                    break;
                }
            } 
            if(startpoint==0){
                break 
            }
        }
        if(startpoint>0){
            return `**${sender}** *${words.slice(startpoint, words.length).join(' ')}`;
        }
        return `**${sender}** *${words.join(" ")}`;
    }


    async closeSettings(channel){
        channel.updateOverwrite(this.getCampaign().Master.id,{ 
            VIEW_CHANNEL: false,
            SEND_MESSAGES:false,
            READ_MESSAGE_HISTORY:false 
        });

        this.getSettingsCollectors().forEach(async col => {
            await col.stop();
        });

        this.getSettingsPopUp().delete();
   }

    setSettings(){
        this.openSettings();
        this.switcher();
    }

    openSettings(){
        this.getSettingsChannel().updateOverwrite(this.getCampaign().Master.id,{ 
            VIEW_CHANNEL: true,
            SEND_MESSAGES:true,
            READ_MESSAGE_HISTORY:true 
        });
    }

    async switcher(){
        let guide=`***NPC GUIDE***\n------------------------------------\n**(Adding a Character)**\n\nCommand:\n\`"-add <name>"\`\n\n*Example:*\n\`-add Seele Zauga\`\n\n------------------------------------\n**(Using an NPC)**\n\nCommand:\n\`"<character number>"\`\n\n*Example:*\n\`7\``;

        let guideEmbed = new MessageEmbed()
        .setColor(this.textColor)
        .setDescription(`${guide}`);
        await this.getSettingsChannel().send(guideEmbed);


        let characterList="";
        let characters = this.getNPCs();
        for (let i = 0; i < characters.length; i++) {
            characterList += `*${i+1}. ${characters[i]}*`;
            if(i!=characters.length){
                characterList+=`\n`;
            } 
        }

        let embed = new MessageEmbed()
        .setColor(this.textColor)
        .setDescription(`***YOUR CHARACTER LIST***\n------------------------------------\n\n${characterList}\n------------------------------------\nCurrently using: **${this.getParty()[0].getAvatar().name}**\n`);
        let popUp = await this.getSettingsChannel().send(embed);
        this.setSettingsPopUp(popUp);

        let npcFilter = m => this.isNPC(m.author.id) || this.isNarrator(m.author.id);
        let npcCollector = this.getSettingsChannel().createMessageCollector(npcFilter);
        this.pushSettingsCollector(npcCollector);
        npcCollector.on('collect', async m => {
            m.delete();
            if(m.content.startsWith("-")){
                let args = util.exactString("-",m.content);
                const cmd = args[0];
                if(cmd==="add"){
                    let npcName = args[1];
                    npcName = npcName.join(" ");
                    this.pushNPC(npcName);
                }
            }else{
                if(m.content>1&&m.content<=this.getNPCs().length){
                    this.getParty()[0].getCharacters()[1].newName = this.getNPCs()[m.content-1];
                    this.getParty()[0].setAvatar(this.getParty()[0].getCharacters()[1]);

                }else if(m.content==1){
                    this.getParty()[0].setAvatar(this.getParty()[0].getCharacters()[0]);
                }
            }
            let cl="";
            let ch = this.getNPCs();
            for (let i = 0; i < ch.length; i++) {
                cl += `*${i+1}. ${ch[i]}*`;
                if(i!=ch.length){
                    cl+=`\n`;
                } 
            }
            embed
            .setColor(this.textColor)
            .setDescription(`***YOUR CHARACTER LIST***\n------------------------------------\n\n${cl}\n------------------------------------\nCurrently using: **${this.getParty()[0].getAvatar().name}**\n`);
            popUp.edit(embed);
        });
    }


    nameFixer(name){
        if(name==""){
            return "Narrator";
        }else{
            return name;
        }
    }

   

  
 
    

    //--------------------------- SETTERS AND GETTERS
    pushMessage(a){this.embeds.push(a);}

    getMessages(){return this.messages;}

    getParty(){return this.party;}

    pushToParty(a){this.party.push(a);}

    setCampaign(a){this.campaign=a;}
    getCampaign(){return this.campaign;}

    setGoal(a){this.goal=a;}
    getGoal(){return this.goal;}

    setChatChannel(a){this.chatChannel=a;}
    getChatChannel(){return this.chatChannel;}

    setMainChannel(a){this.mainChannel=a;}
    getMainChannel(){return this.mainChannel;}

    setSettingsChannel(a){this.settingsChannel=a;}
    getSettingsChannel(){return this.settingsChannel;}

    setSettingsPopUp(a){this.settingsPopUp=a;}
    getSettingsPopUp(){return this.settingsPopUp;}

    pushSettingsCollector(a){this.settingsCollectors.push(a);}
    getSettingsCollectors(){return this.settingsCollectors;}

    pushNPC(a){this.NPCs.push(a);}
    getNPCs(){return this.NPCs;}
    
}

module.exports = gate_keeper;