const util = require("./utility");
const modes = require("./modes");
const roles = require("./roles");
const Role = require("./role");
const Player = require("./player");
const Channel = require("./channel");
const {MessageEmbed} = require('discord.js');


class Setup{

  town;
  townChannel;
  Lwrap = `‎\n\`\`\`json\n`;
  Rwrap = `\`\`\``;

  constructor(town){
    this.town = town;
  }

  async setupJudgementCollector(){
    let embed = new MessageEmbed()
    .setColor("#000000")
    .setTitle( `⚖️ The Judgement`)
    .setDescription(`**Accused:** ${this.town.getVotedUp().getUsername()}`);

    for await (const p of this.town.getPlayers()) {
      if(p.getStatus()=="Alive" && p.getId()!=this.town.getVotedUp().getId()){
        embed.setDescription(`**Accused:** ${this.town.getVotedUp().getUsername()}\n\n🙆‍♂️ - Innocent\n🙅 - Guilty`);
      }
      let card = await p.getHouse().setJudgeCard(embed);
      if(p.getStatus()=="Alive" && p.getId()!=this.town.getVotedUp().getId()){
        await card.react('🙆‍♂️').catch();
        card.react('🙅').catch();
        const filter = () => {return true;};
        let judgeCollector = card.createReactionCollector(filter,{dispose:true});
        judgeCollector.on('collect', async (reaction, user) => {
          if(!user.bot){
            switch(reaction.emoji.name){
              case "🙆‍♂️":
                p.pushJudgement("Innocent");
              break;
              case "🙅": 
                p.pushJudgement("Guilty");
              break;
            }
            const userReactions = card.reactions.cache.filter(r => r.emoji.name!=reaction.emoji.name);
            for (const reaction of userReactions.values()) {
              await reaction.users.remove(user.id);
            }
            this.town.pushJudgement(p,p.getJudgement()[p.getJudgement().length-1]);
          }
        });
        judgeCollector.on('remove', async (reaction) => {
          switch(reaction.emoji.name){
              case "🙆‍♂️":
                p.removeJudgement("Innocent");
              break;
              case "🙅": 
                p.removeJudgement("Guilty");
              break;
          }
          if(p.getJudgement().length==1){
            p.pushJudgement("Abstain");
            this.town.pushJudgement(p,p.getJudgement()[p.getJudgement().length-1]);
          }
        });
      }
    }
  }

  

  async finalJudgements(){

    let finalString=``;
    let temp="";
    let pl = util.shuffleArray(this.town.getPlayers().filter(p=>p.getStatus()=="Alive" && p.getId()!=this.town.getVotedUp().getId()));
    let guilty=0;
    let inno=0;

    pl.forEach(p => {
      if(p.getJudgement().length>0){
        switch(p.getJudgement()[p.getJudgement().length-1]){
          case "Innocent":
            temp = "has voted ***Innocent***";
            inno+=p.getVoteCount();
            break;
          case "Guilty":
            temp = "has voted ***Guilty***";
            guilty+=p.getVoteCount();
            break;
          case "Abstain":
            temp = "has ***Abstained***";
            break;
        }
      }else{
        temp = "has ***Abstained***";
      }
      if(finalString.length>0){
        finalString+=`\n**${p.getUsername()}** ${temp}.`;
      }else{
        finalString+=`**${p.getUsername()}** ${temp}.`;
      }
    });

    finalString+=`\n\nGuilty: ${guilty}\nInnocent: ${inno}`;

    for await (const p of this.town.getPlayers()) {
      p.getHouse().updateJudgeCard(finalString);
    }

    if(guilty>inno){
      return true;
    }else{
      return false;
    }
  }

  async setupGuides(){

    let content;

    await this.town.getPlayers().forEach(async player => {
      content = `This is your Notepad Channel\n\n- Use this channel to write any important details in the game.\n- You can only send 1 message so just edit it when you have to.`;
      content = `${this.Lwrap}${content}${this.Rwrap}`;
      player.getNotepad().getChannel().send(content).catch();
      await player.getHouse().updateShortGuide();
      await player.getHouse().updateCommandList();
      player.getHouse().updatePlayerCard();
    });

  }

  async setupExeTarget(){
    let exe = this.town.getPlayers().filter(p=>p.getRole().getName()=="Executioner");
    if(exe.length>0){
        exe = exe[0];
        let townies = this.town.getPlayers().filter(p=>p.getRole().getAlignment()=="Town");
        townies = util.shuffleArray(townies);
        exe.setTarget(townies[0]);
    }
  }

  updateReadyCollector(embed,address,guideIntro){
    let list = "";
    let players = this.town.getPlayers();
    for(let i=0;i<players.length;i++){
      list+=`${players[i].getListNumber()}. **${players[i].getUsername()}** (${players[i].getIsReady()})`;
      if(i<players.length){
        list+="\n";
      }
    }

    embed.setDescription(`${guideIntro}\n\n${list}`);
    address.edit(embed);
  }

 
  async openNotepadChannels(){
    for await (const p of this.town.getPlayers()) {
      p.getNotepad().open();
    }
  }

  async openHouseChannels(){
    for await (const p of this.town.getPlayers()) {
      p.getHouse().open();
    }
  }

  async closeNotepadChannels(){
    for await (const p of this.town.getPlayers()) {
      p.getNotepad().close();
    }
  }

  async closeHouseChannels(){
    for await (const p of this.town.getPlayers()) {
      p.getHouse().close();
    }
  }

  async listenHouseChannel(){
    this.town.getPlayers().forEach(player => {
      player.cleanHelpers();
      if(player.getJailStatus()==false){
        switch(this.town.getClock().getPhase()){
          case "Discussion":
          case "Night":
          case "Night (Full Moon)":
            player.getHouse().updatePhaseSign();
            break;
          default:break;
        }
      }
    });
  }

  async cleanChannel(channel){
    let fetched;
    do {
      fetched = await channel.messages.fetch({limit: 100});
      await channel.bulkDelete(fetched);
    }
    while(fetched.size >= 2);
  }

 



  isHost(id){
    return this.town.getHost().getHostId()===id;
  }


  async setupClockChannel(){

    for await (const g of this.town.getGuilds()) {
      let clock_key = this.town.getGameKeys().filter(k=>k.guild.id==g.id);
      if(clock_key.length==1){
        clock_key=clock_key[0];
        let temp = await g.channels.create(`⏳﹕game-clock`, {
          type: "text",
          permissionOverwrites: [
            {
              id: g.roles.everyone, 
              allow: [],
              deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
            },
            {
              id: clock_key, 
              allow: ['READ_MESSAGE_HISTORY'],
              deny: []
            },
          ],
        });
        this.town.pushChannel(new Channel("clock",temp));
      }
    }

  }

  async setupPlayerCollectors(){
    this.town.getPlayers().forEach(player => {
      player.setupCollector();
    });
  }

  async showStartingChannels(){
    this.town.getPlayers().forEach(player => {
      player.getExRoles().forEach(xr => {
        player.getUser().roles.remove(xr);
      });
      player.getChannels().forEach(channel => {
        channel.getChannel().updateOverwrite(player.getId(),{ 
          VIEW_CHANNEL:true
        });
      });
    });
    this.town.getClockChannels().forEach(ch => {
      let clock_key = this.town.getClockKeys().filter(k=>k.guild.id==ch.getChannel().guild.id);
      clock_key.forEach(ck => {
        ch.getChannel().updateOverwrite(ck.id,{ 
          VIEW_CHANNEL:true
        });
      });
    });
  }

  async setupPlayers(){
    let players = this.town.getHost().getPlayers();

    let rolled_roles = [];
    let role_filter = roles.list;
    let avail_modes = modes.list.filter(m => m.PlayerCount == players.length);
    let rand = Math.floor((Math.random() * avail_modes.length) + 0);

    let rolePool = avail_modes[rand].LineUp;
    for (let i = 0; i < rolePool.length; i++) {

      if(rolePool[i][0]!="Random"){
        role_filter = roles.list.filter(r => r.Alignment == `${rolePool[i][0]}`);
        if(rolePool[i][1]!="Random"){
          role_filter = role_filter.filter(r => r.Type == `${rolePool[i][1]}`);
          if(rolePool[i][2]!="Random"){
            role_filter = role_filter.filter(r => r.Name == `${rolePool[i][2]}`);
          }
        }
      }

      let r = Math.floor((Math.random() * role_filter.length) + 0);
      let picked_role = role_filter[r];
      if(picked_role.Unique){
        let check = rolled_roles.filter(r=>r.Name==picked_role.Name);
        if(check.length>0){
          i--;
        }else{
          rolled_roles.push(picked_role);
        }
      }else{
        rolled_roles.push(picked_role);
      }
    }

    players = util.shuffleArray(players);
    rolled_roles = util.shuffleArray(rolled_roles);

    for(let i=0;i<rolled_roles.length;i++){
      let player = new Player(this.town,i+1,players[i],new Role(rolled_roles[i]));
      this.town.pushPlayer(player);
      this.town.pushGuild(players[i].guild);
      await this.setupChannels(player);
      player.getRole().setPlayer(player);
    } 

    return new Promise((resolve)=> {
      resolve(true);
    });
  }

  async setupChannels(player){
    let temp;

    temp = await player.getGuild().channels.create(`🌹﹕salem`, {
      type: "text",
      permissionOverwrites: [
        {
          id: player.getGuild().roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        },
        {
          id: player.getId(), 
          allow: ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          deny: []
        },
      ],
    })
    player.pushChannel(new Channel("house",temp));
    player.getHouse().setPlayer(player);

    temp = await player.getGuild().channels.create(`📜﹕notepad`, {
      type: "text",
      permissionOverwrites: [
        {
          id: player.getGuild().roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        },
        {
          id: player.getId(), 
          allow: ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
          deny: []
        },
      ],
    });
    temp.setRateLimitPerUser(3600);
    player.pushChannel(new Channel("notepad",temp));
    player.getNotepad().setPlayer(player);

    return new Promise((resolve)=> {
      resolve(true);
    });
  }

  async createGameKeys(){

    let guilds = this.town.getGuilds();

    for await (const g of guilds) {
      
      let gameRole = await g.roles.create({
        data: {
          name: 'Key',
          color: '#0f0f0f',
        },
      });
      this.town.pushGameKey(gameRole);
      
    }

  }

  async passRoles(){
    this.town.getPlayers().forEach(player => {
      let user = player.getGuild().members.cache.find(m => m.id === player.getId());
      let keys = this.town.getGameKeys().filter(k=>k.guild.id==player.getGuild().id);
      keys.forEach(k => {
        switch (k.name){
          case "Key":
            user.roles.add(k);
            break;
        }
      });
    });
  }


}

module.exports = Setup;