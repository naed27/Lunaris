const util = require("./utility");
const guidebook = require("./guide");
const {MessageEmbed} = require('discord.js');

class Channel{
    
    player;
    name;
    channel;
    timer;
    sign;
    shortGuide;
    helper;
    judgeCard;
    playerList;
    playerCard;
    commandList;
    signCollector;
    collector;
    embeds=[];

    constructor(name,channel){
        this.name = name;
        this.channel = channel;
    }

    getJudgeCard(){return this.judgeCard;}
    async setJudgeCard(embed){
        this.deleteJudgeCard();
        this.judgeCard = await this.channel.send("‎",embed).catch();
        return this.judgeCard;
    }

    deleteJudgeCard(){
        if(this.judgeCard){
            this.judgeCard.delete().catch();
            this.judgeCard=null;
        }
    }

    async updateJudgeCard(body){
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle( `⚖️ The Judgement`)
        .setDescription(`**Accused:** ${this.player.getTown().getVotedUp().getUsername()}\n\n${body}`);
        this.deleteJudgeCard();
        this.judgeCard = await this.channel.send("‎",embed).catch();
        return this.judgeCard;
    }

    editJudgeCard(body){
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle( `⚖️ The Judgement`)
        .setDescription(``);
        if(this.player.getStatus()=="Alive"){
            embed.setDescription(`**Accused: ${this.player.getTown().getVotedUp().getUsername()}**\n\n${body}\n\n🙆‍♂️ - Innocent\n🙅 - Guilty`);
        }else{
            embed.setDescription(`**Accused: ${this.player.getTown().getVotedUp().getUsername()}**\n\n${body}`);
        }
        this.judgeCard.edit(embed);
    }

 
    async updatePhaseSign(){
        let phase = this.player.getTown().getClock().getPhase();
        let string="";
        let cmd_len=0;

        this.player.getRole().getCommands().forEach(c => {
            if(c.getStocks()>0 && c.getStatus()==this.player.getStatus() && util.containsElement(c.getPhase(),phase) && c.getPermission()=="Role Holder"){
                string+=`${this.player.getTown().getPrefix()}${c.getGuide()}`;
                if(c.getStocks()<99){
                    let gmar;
                    if(c.getStocks()==1){gmar=`use`;}
                    else{gmar=`uses`}
                    string+=` (${c.getStocks()} ${gmar} left)`
                }
                
                cmd_len++;
                string+=`\n`;
            }
        });
    
        if(cmd_len>0){
            let emoji;
            let half;
            let grammar;
            if(phase=="Night" || phase == "Night (Full Moon)"){emoji="🌙";half = "Night";
            }else{emoji="☀️";half="Day"}
            if(cmd_len==1){grammar = "Command";
            }else{grammar = "Commands";}

            let buttonGuide = `📘 - see the Players List\n${emoji} - your ${half} ${grammar}`;

            this.deletePhaseSign();
            let embed = new MessageEmbed()
            .setColor("#000000")
            .setDescription(`${buttonGuide}`)
            .setFooter(``);
            this.sign = await this.channel.send("‎\n",embed).catch();
            await this.sign.react("📘");
            await this.sign.react(emoji);
            const filter = () => {return true;};
            let collector = this.sign.createReactionCollector(filter,{dispose:true});
            collector.on('collect', async (reaction, user) => {
                if(!user.bot){
                    switch(reaction.emoji.name){
                    case emoji: 
                        embed
                        .setColor("#000000")
                        .setDescription(`**Your ${half} ${grammar}**\n------\n\n${string}\n\n------\n${buttonGuide}`);
                        this.sign.edit(embed);
                    break;
                    case "📘": 
                        {let list ="\n";
                        let players = this.player.getTown().getPlayers();
                        for (let i = 0; i < players.length; i++) {
                            if(players[i].getStatus()==="Alive"){
                                list+=`**${players[i].getListNumber()}**   ${players[i].getUsername()}`;
                            }else{
                                list+=`~~**${players[i].getListNumber()}**   ${players[i].getUsername()}~~ (${players[i].getMaskRole().getName()})`;
                            }
                            if(players[i].getId()==this.player.getId()){
                                list+=` (You)`;
                            }
                    
                            if(i<players.length){
                                list+=`\n`;
                            }
                        }
                        embed
                        .setDescription(`**List of Players**\n------\n${list}\n\n------\n${buttonGuide}`);
                        this.sign.edit(embed);}
                        break;
                    }
                    const userReactions = this.sign.reactions.cache.filter(r => r.emoji.name!=reaction.emoji.name);
                    for (const reaction of userReactions.values()) {
                        await reaction.users.remove(user.id);
                    }
                }
            });

            collector.on('remove', async (reaction, user) => {
                const userReactions = this.sign.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
                if(util.getMapSize(userReactions)==0){
                    embed
                    .setColor("#000000")
                    .setTitle(``)
                    .setDescription(`${buttonGuide}`)
                    .setFooter(``);
                    this.sign.edit(embed);
                }
              });
        }        
    }

    deletePhaseSign(){
        if(this.sign){
            this.sign.delete().catch();
            this.sign=null;
        }
    }

    async updatePlayerCard(){
        this.deletePlayerCard();
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle(``)
        .setDescription(`Tap the 🔱 to see your role!`)
        .setFooter(``);
        this.playerCard = await this.channel.send("‎\n",embed).catch();

        await this.playerCard.react('🔱');
        const filter = () => {return true;};
        let collector = this.playerCard.createReactionCollector(filter,{dispose:true});
        collector.on('collect', async (reaction, user) => {
            if(!user.bot){
                await this.playerCard.reactions.removeAll();
                switch(reaction.emoji.name){
                case "🔱": 
                    embed
                    .setTitle(`${this.player.getRole().getName()}`)
                    .setDescription(`${this.player.roleDetails()}`)
                    .setFooter(`Don't share this info with anyone unless you trust them!`);
                    this.playerCard.react('↩️');
                break;
                case "↩️": 
                    embed
                    .setTitle(``)
                    .setDescription(`Tap the 🔱 to see your role!`)
                    .setFooter(``);
                    this.playerCard.react('🔱');
                break;
                }
                this.playerCard.edit(embed);
            }
        });
    }

    deletePlayerCard(){
        if(this.playerCard){
            this.playerCard.delete().catch();
            this.playerCard=null;
        }
    }

    deleteShortGuide(){
        if(this.shortGuide){
            this.shortGuide.delete().catch();
            this.shortGuide=null;
        }
    }

    async updateShortGuide(){
        this.deleteShortGuide();
        let page = 1;
        let body = guidebook.pages[page-1];
        let embed = new MessageEmbed()
        .setColor(`#000000`)
        .setTitle(``)
        .setDescription(`${body}`)
        .setFooter(`Page ${page}/${guidebook.pages.length}`);
        this.shortGuide = await this.channel.send(embed); 
        const filter = () => {return true;};
        let collector = this.shortGuide.createReactionCollector(filter,{dispose:true});
        collector.on('collect', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){
                case "⬅️":
                    if(page>1){page--;}else{page=guidebook.pages.length;}
                    break;
                case "➡️":
                    if(page<guidebook.pages.length){page++;}else{page=1;}
                    break;
                }
                pageUpdater(page,embed,this.shortGuide);
            }
        });

        collector.on('remove', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){
                case "⬅️":
                    if(page>1){page--;}else{page=guidebook.pages.length;}
                    break;
                case "➡️":
                    if(page<guidebook.pages.length){page++;}else{page=1;}
                    break;
                }
                pageUpdater(page,embed,this.shortGuide);
            }
        });

        await this.shortGuide.react("⬅️");
        this.shortGuide.react("➡️");

        function pageUpdater(page,embed,address){
            body = guidebook.pages[page-1];
            embed
            .setDescription(`${body}`)  
            .setFooter(`Page ${page}/${guidebook.pages.length}`);
            address.edit(embed);
        }
    }

    async updatePlayerList(){
        this.deletePlayerList();
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle(``)
        .setDescription(`Here's an updated player list! 📘`)
        .setFooter(``);
        this.playerList = await this.channel.send("‎\n",embed).catch();

        await this.playerList.react('📘');
        const filter = () => {return true;};
        let collector = this.playerList.createReactionCollector(filter,{dispose:true});
        collector.on('collect', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){
                case "📘": {
                    let list ="\n";
                    let players = this.player.getTown().getPlayers();
                    for (let i = 0; i < players.length; i++) {
                        if(players[i].getStatus()==="Alive"){
                            list+=`**${players[i].getListNumber()}**   ${players[i].getUsername()}`;
                        }else{
                            list+=`~~**${players[i].getListNumber()}**   ${players[i].getUsername()}~~ (${players[i].getMaskRole().getName()})`;
                        }
                        if(players[i].getId()==this.player.getId()){
                            list+=` (You)`;
                        }
                        if(i<players.length){
                            list+=`\n`;
                        }
                    }
                    embed
                    .setDescription(`**List of Players**\n------\n${list}`);
                    this.playerList.edit(embed);
                    await this.playerList.reactions.removeAll();
                    this.playerList.react('↩️');
                }
                break;
                case "↩️": 
                    embed
                    .setColor("#000000")
                    .setDescription(`Here's an updated player list! 📘`)
                    this.playerList.edit(embed);
                    await this.playerList.reactions.removeAll();
                    this.playerList.react('📘');
                break;
                }
            }
        });
    }

    deletePlayerList(){
        if(this.playerList){
            this.playerList.delete().catch();
            this.playerList=null;
        }
    }

    async updateCommandList(){
        this.deleteCommandList();
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle(``)
        .setDescription(`Here's your command list! 📗`)
        .setFooter(``);
        this.commandList = await this.channel.send("‎\n",embed).catch();

        await this.commandList.react('📗');
        const filter = () => {return true;};
        let collector = this.commandList.createReactionCollector(filter,{dispose:true});
        collector.on('collect', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){
                case "📗": {
                
                    let list ="**Commands**\n--------\n\n"; 
                    let phase = this.player.getTown().getClock().getPhase();
                    let all_commands = this.player.getRole().getCommands();
                    let role_commands = all_commands.filter(c=>util.containsElement(c.getPhase(),phase) && c.getStocks()>0 && c.getStatus()==this.player.getStatus() && c.getPermission()=="Role Holder");
                    let player_commands = all_commands.filter(c=>c.getPermission()=="Player" && util.containsElement(c.getPhase(),phase) );
                    let host_commands = all_commands.filter(c=>c.getPermission()=="Host" && util.containsElement(c.getPhase(),phase));
                    let admin_commands = all_commands.filter(c=>c.getPermission()=="Admin" && util.containsElement(c.getPhase(),phase));
                    let shown_commands = [];

                    shown_commands.push(...role_commands);
                    shown_commands.push(...player_commands);

                    if(this.player.getTown().getSetup().isHost(this.player.getId())){
                        shown_commands.push(...host_commands);
                    }

                    if(this.player.getId()=="481672943659909120"){
                        shown_commands.push(...admin_commands);
                    }

                    for (let i = 0; i < shown_commands.length; i++) {
                        list+=`\n.${shown_commands[i].getGuide()}`;
                    }

                    embed
                    .setDescription(`${list}\n\n--------`)
                    .setFooter(`You can shorten the commands if you're a lazy typer!\nYou can also shorten the player names!`);

                    this.commandList.edit(embed);
                    await this.commandList.reactions.removeAll();
                    this.commandList.react('↩️');
                }
                break;
                case "↩️": 
                    embed
                    .setColor("#000000")
                    .setDescription(`Here's your command list! 📗`)
                    .setFooter(``);
                    this.commandList.edit(embed);
                    await this.commandList.reactions.removeAll();
                    this.commandList.react('📗');
                break;
                }
            }
        });
    }

    deleteCommandList(){
        if(this.commandList){
            this.commandList.delete().catch();
            this.commandList=null;
        }
    }

    getHelper(){return this.helper;}
    setHelper(a){this.helper=a}

    async updateHelper(body,footer,duration){

        if(this.player.getTown().getClock().getHourSand()<duration){
            duration = this.player.getTown().getClock().getHourSand()*1000;
        }

        this.deleteHelper();
        let embed = new MessageEmbed()
        .setColor("#000000")
        .setDescription(`${body}`)
        .setFooter(`${footer}`);

        this.helper = await this.channel.send("‎\n",embed).catch();

        if(duration!=0){
            await this.helper.delete(duration);
            this.helper=null;
        }
    }

    deleteHelper(){
        if(this.helper){
            this.helper.delete().catch();
            this.helper=null;
        }
    }

    

   

    //  setters and getters

    getPlayer(){return this.player}
    setPlayer(a){this.player=a;}

    getSign(){return this.sign}
    setSign(a){this.sign=a;}

    getPlayerList(){return this.playerList;}
    setPlayerList(a){this.playerList=a;}
   
    getName(){return this.name;}
    setName(a){this.name = a;}

    getChannel(){return this.channel;}
    setChannel(a){this.channel = a;}

    getCollector(){return this.collector;}
    setCollector(a){this.collector = a;}

    getSignCollector(){return this.signCollector;}
    setSignCollector(a){this.signCollector = a;}

    getTimer(){return this.timer;}
    setTimer(a){this.timer=a;}

    getEmbeds(){return this.embeds;}
    pushEmbed(a){this.embeds.push(a);}
    clearEmbeds(){this.embeds=[];}

    showAndOpen(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            SEND_MESSAGES:true,
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true 
        });
    }

    hideAndClose(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            SEND_MESSAGES:false,
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    open(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            SEND_MESSAGES:true,
        });
    }

    close(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            SEND_MESSAGES:false,
        });
    }

    hide(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            VIEW_CHANNEL: false,
            READ_MESSAGE_HISTORY:false 
        });
    }

    show(){
        this.getChannel().updateOverwrite(this.player.getId(),{ 
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY:true 
        });
    }
    

}

module.exports = Channel;