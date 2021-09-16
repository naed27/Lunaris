const util = require("./utility");
const {MessageEmbed} = require('discord.js');
const modes = require("./modes");
class Host{

    town;
    host;
    tickets = [];
    players = [];
    lineup = [];
    goal = 2;
    goFlag=false;
    embedColor = "#000000";

    constructor(m, town){
        this.town = town;
        this.host = m.author;
        this.channel = m.channel;
    }

    // setters and getters
    getPlayers(){return this.players;}
    getHostId(){return this.host.id;}
    getTown(){return this.town;}

    async editHostCards(embed){
        for (const t of this.tickets) {
            t.address.edit(embed);
        }
    }

    async notifyGameStart(){
        let players = "**Players:**";
        this.getTown().getPlayers().forEach(p => {
            players+=`\n- ${p.getUsername()} (${p.getGuild().name})`;
        });

        let embed = new MessageEmbed()
        .setColor(this.embedColor)
        .setAuthor(`Town of Salem`)
        .setDescription(`${players}\n`)
        .setFooter(`Game is currently ongoing.`)
        await this.editHostCards(embed);
    }

    async notifyGameEnd(){
        let string = "End Results:\n";
        this.getTown().getPlayers().forEach(p => {
            let user = p.getGuild().members.cache.get(p.getId());
            let real_name = user.user.username;
            if(p.getWinStatus()){
                string+=`-----\n${real_name} / ${p.getUsername()} (Victorious)\nRole: ${p.getRole().getName()}\nServer: ${p.getGuild().name}\n`;
            }else{
                string+=`-----\n${real_name} / ${p.getUsername()}\nRole: ${p.getRole().getName()}\nServer: ${p.getGuild().name}\n`;
            }
        });
        let embed = new MessageEmbed()
        .setColor(this.embedColor)
        .setAuthor(`Town of Salem`)
        .setDescription(`${string}\n`)
        .setFooter(`Game has ended.`)
        await this.editHostCards(embed);
    }

    async sendTicket(channel,summoner){
        let embed = new MessageEmbed()
        .setColor(this.embedColor)
        .setAuthor(`Town of Salem`)
        .setDescription(`Players:\n\nClick the 🚪 to join.`)
        .setFooter(`Hosted by: ${this.host.username}`);
        
        let address = await channel.send(embed);
        const rfilter = (reaction, user) => {return true;};
        let reactCollector = address.createReactionCollector(rfilter,{ time: 180000, dispose:true});
        let mfilter = m => m.author.id == this.host.id;
        let msgCollector = channel.createMessageCollector(mfilter)

        let ticket = {
            guild:channel.guild,
            summoner:summoner,
            address:address,
            embed:embed,
            reactCollector:reactCollector,
            msgCollector:msgCollector,
        }

        this.pushTicket(ticket);
        await this.updatePlayerList(ticket);

        ticket.msgCollector.on('collect', async m => { 
            if(m.content.startsWith(this.town.getPrefix())){
                let args = util.exactString(this.town.getPrefix(),m.content);
                const cmd = args[0];
                const inputs = args[1];

                switch(cmd){
                    case "set":
                        let res = this.town.getFunctions().findRoleLine(inputs);
                        if(res){
                            this.lineup[res[0]]=res[1];
                            this.updatePlayerList(ticket);
                        }
                        break;
                    case "clear":
                        break;
                }
            }
        });

        ticket.reactCollector.on('collect', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){

                    case "🚪": 
                        this.addPlayer(user,ticket.guild);
                        await this.updatePlayerList(ticket);
                    break;

                    case "▶️":
                        if(user.id==this.host){  
                            if(modes.list.filter(m=>m.PlayerCount==this.players.length).length>0){
                                this.goFlag=true;
                                ticket.reactCollector.stop();
                            }
                        }
                        address.reactions.resolve(reaction.emoji.name).users.remove(user.id);
                    break;
                    
                    case "❌": 
                        if(user.id==summoner.id){ 
                            ticket.reactCollector.stop();
                        }else{address.reactions.resolve(reaction.emoji.name).users.remove(user.id);}
                    break;

                    default:
                        const userReactions = address.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
                        for (const reaction of userReactions.values()) {
                            await reaction.users.remove(user.id).catch(error=>{});
                        }
                    break;

                }
            }
        });

        ticket.reactCollector.on('remove', async (reaction, user) => {
            if(!user.bot){
                switch(reaction.emoji.name){
                    case "🚪": 
                        this.removePlayer(user,ticket.guild);
                        await this.updatePlayerList(ticket);
                    break;
                }
            }
        });

        ticket.reactCollector.on('dispose', async (reaction, user) => {
            switch(reaction.emoji.name){
                case "🚪": 
                case "▶️":
                case "❌": 
                    ticket.reactCollector.stop();
                break;
            }
        });

        ticket.reactCollector.on('end', async collected => {
            if(this.goFlag==false){
                await ticket.address.reactions.removeAll();
                let party = this.players.filter(p=>p.guild.id == ticket.guild.id);
                party.forEach(p => {
                    this.removePlayer(p.user,ticket.guild);
                });

                await this.updatePlayerList(ticket);

                let message = new MessageEmbed()
                .setColor(this.embedColor)
                .setAuthor(`Town of Salem`)
                .setDescription(`Cancelled.`)
                .setFooter(``);
                
                this.town.getInventory().deletePortal(ticket.guild);

                if(summoner.id==this.host.id){ // if the host cancelled it

                    for (const t of this.tickets) {
                        t.address.reactions.removeAll();
                        t.address.edit(message)
                    }

                    this.tickets=[];
                    this.town.getInventory().deleteSalem(`${ticket.guild.id}${summoner.id}`);
                }else{ // if its not the host
                    ticket.address.edit(message);
                    this.deleteTicket(ticket.summoner);
                }
            }else if(this.goFlag==true){
                this.goFlag="yeet";
                let message = new MessageEmbed()
                .setColor(this.embedColor)
                .setAuthor(`Town of Salem`)
                .setDescription(`Players:\n${this.getJoinedPlayers()}`)
                .setFooter(`Loading up the game. Please wait...`);
                this.tickets.forEach(t => {
                    t.address.reactions.removeAll();
                    t.address.edit(message)
                });
                this.town.setupGame();
                
            }
        });

        await address.react('🚪');

        if(ticket.summoner.id==this.host.id){
            await address.react('▶️');
        }
    
        await address.react('❌');

    }

    deleteTicket(summoner){
        let index = this.tickets.findIndex(t => t.summoner.id == summoner.id);
        if (index > -1) {
            this.tickets.splice(index, 1);
        }
    }

    pushTicket(ticket){
        this.tickets.push(ticket);
    }


    addPlayer(user,guild){
        if(this.players.length<15){
            if(this.isNewPlayer(user)){
                let player = {
                    user:user,
                    guild:guild
                }
                this.players.push(player);
            }
        }
    }

    removePlayer(user,guild){
        let index = this.players.findIndex(p => p.user.id == user.id && p.guild.id == guild.id);
        if (index > -1) {
            this.players.splice(index, 1);
        }
    }

    isNewPlayer(user){
        let result = this.players.filter(p => p.user.id == user.id);
        if(result.length==0){
            return true;
        }else{
            return false;
        }
    }

    getJoinedPlayers(){
        let player_list="";
        let i=1;
        this.players.forEach(p => {
            player_list+=`- ${p.user.username} (${p.guild.name})`;
            if(i!=this.players.length){
                player_list+=`\n`;
            } i++;
        });
        return player_list;
    }

    getLineUp(){
        let res = "";
        let newLineup=[];
        newLineup = this.lineup;
        console.log(newLineup);
        console.log("----------")
        while(newLineup.length!=this.players.length){
            newLineup.push(["-", "TBD"]);
        }

        for (let i = 0; i < newLineup.length; i++) {
            let filt = [...new Set(newLineup[i])];
            if(filt.length==3&&filt[2]!="Random"){
                res+=`${filt[2]}`;
            }else{
                res+=`${filt.join(" ")}`;
            }
            if(i<newLineup.length-1){
                res+=`\n`;
            }
        }

        console.log(res);
        return res;
    }

    async updatePlayerList(ticket){
        let lineup_list = this.getLineUp();
        let player_list = this.getJoinedPlayers();
        ticket.embed.setDescription(`Line Up:\n${lineup_list}\n\nPlayers:\n${player_list}\n\nClick the 🚪 to join.`);
        await this.editHostCards(ticket.embed);
    }

    removeReactionsAllAddress(){
        this.tickets.forEach(t => {
            t.address.reactions.removeAll();
        });
    }

    
}

module.exports = Host;