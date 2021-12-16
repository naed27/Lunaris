import util from "./utility";
import modes from "./modes";
import roles from "./roles";
import Role from "./role";
import Player from "./player";
import Channel from "./channel";
import { MessageEmbed, Guild, TextChannel } from 'discord.js';
import Game from "./game";
import { createEmbed, createMarkDown, shuffleArray } from "../../Helpers/toolbox";

export default class Setup{

  game: Game;
  guild: Guild;
  gameChannel: TextChannel;

  constructor( game: Game ){
    this.game = game;
    this.guild = game.getGuild();
  }

  async setupJudgementCollector(){
    const title = `⚖️ The Judgement`;
    const description = `Accused: ${this.game.getVotedUp().getUsername()}`
    const embed = createEmbed({ title, description });

    this.game.getAlivePlayers().map((player) => {
      if(player.getStatus()=="Alive" && player.getId()!=this.game.getVotedUp().getId()){
        embed.setDescription(`**Accused:** ${this.game.getVotedUp().getUsername()}\n\n🙆‍♂️ - Innocent\n🙅 - Guilty`);
      }
      let card = await player.getHouse().setJudgeCard(embed);
      if(player.getStatus()=="Alive" && player.getId()!=this.game.getVotedUp().getId()){
        await card.react('🙆‍♂️').catch();
        card.react('🙅').catch();
        const filter = () => {return true;};
        let judgeCollector = card.createReactionCollector(filter,{dispose:true});
        judgeCollector.on('collect', async (reaction, user) => {
          if(!user.bot){
            switch(reaction.emoji.name){
              case "🙆‍♂️":
                player.pushJudgement("Innocent");
              break;
              case "🙅": 
                player.pushJudgement("Guilty");
              break;
            }
            const userReactions = card.reactions.cache.filter(r => r.emoji.name!=reaction.emoji.name);
            for (const reaction of userReactions.values()) {
              await reaction.users.remove(user.id);
            }
            this.game.pushJudgement(player,player.getJudgement()[player.getJudgement().length-1]);
          }
        });
        judgeCollector.on('remove', async (reaction) => {
          switch(reaction.emoji.name){
              case "🙆‍♂️":
                player.removeJudgement("Innocent");
              break;
              case "🙅": 
                player.removeJudgement("Guilty");
              break;
          }
          if(player.getJudgement().length==1){
            player.pushJudgement("Abstain");
            this.game.pushJudgement(player,player.getJudgement()[player.getJudgement().length-1]);
          }
        });
      }
    });
  }

  

  async finalJudgements(){

    let finalString=``;
    let temp="";
    let pl = util.shuffleArray(this.game.getPlayers().filter(p=>p.getStatus()=="Alive" && p.getId()!=this.game.getVotedUp().getId()));
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

    for await (const p of this.game.getPlayers()) {
      p.getHouse().updateJudgeCard(finalString);
    }

    if(guilty>inno){
      return true;
    }else{
      return false;
    }
  }

  async setupGuides(){

    const content = `This is your Notepad Channel\n\n- Use this channel to write any important details in the game.\n- You can only send 1 message so just edit it when you have to.`

    this.game.getPlayers().map(async player => {
      const message = createMarkDown(content);
      player.getNotepad().getChannel().send(message).catch();
      await player.getHouse().updateShortGuide();
      await player.getHouse().updateCommandList();
      player.getHouse().updatePlayerCard();
    });

  }

  async setupExeTarget(){
    let exe = this.game.getPlayers().filter(p=>p.getRole().getName()=="Executioner");
    if(exe.length>0){
        exe = exe[0];
        let townies = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Town");
        townies = util.shuffleArray(townies);
        // exe.setTarget(townies[0]);
    }
  }

  updateReadyCollector(embed,address,guideIntro){
    let list = "";
    let players = this.game.getPlayers();
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
    for await (const p of this.game.getPlayers()) {
      p.getNotepad().open();
    }
  }

  async openHouseChannels(){
    for await (const p of this.game.getPlayers()) {
      p.getHouse().open();
    }
  }

  async closeNotepadChannels(){
    for await (const p of this.game.getPlayers()) {
      p.getNotepad().close();
    }
  }

  async closeHouseChannels(){
    for await (const p of this.game.getPlayers()) {
      p.getHouse().close();
    }
  }

  async listenHouseChannel(){
    this.game.getPlayers().map(player => {
      player.cleanHelpers();
      if(player.getJailStatus()==true)return
      const phase = this.game.getClock().getPhase().name;
      switch(phase){
        case "Discussion":
        case "Night":
          player.getHouse().updatePhaseSign();
        break;
        default:break;
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
    return this.game.getHost().getHostId()===id;
  }


  async setupClockChannel(){
    const guild = this.game.getGuild();
    const channel = await guild.channels.create(`⏳﹕game-clock`, {
      type: "GUILD_TEXT",
      permissionOverwrites: [
        {
          id: guild.roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ],
    });
    this.game.pushChannel(new Channel("clock",channel));
  }


  async setupPlayerCollectors(){
    this.game.getPlayers().forEach(player => {
      player.setupCollector();
    });
  }

  showPlayerChannels = async () => {
    this.game.getPlayers().map(async p => p.getChannelManager().show(p.getId()));
  }

  showStageChannel = async () => this.game.getStageChannelManager().show();
  showClockChannel = async () => this.game.getClockChannelManager().show();


  async setupPlayers(){

    const players = shuffleArray(this.game.getHost().getJoinedPlayers())

    let rolled_roles = [];
    let role_filter = roles;
    let avail_modes = modes.list.filter(m => m.PlayerCount == players.length);
    let rand = Math.floor((Math.random() * avail_modes.length) + 0);

    let rolePool = avail_modes[rand].LineUp;
    for (let i = 0; i < rolePool.length; i++) {

      if(rolePool[i][0]!="Random"){
        role_filter = roles.filter(r => r.Alignment == `${rolePool[i][0]}`);
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

    rolled_roles = util.shuffleArray(rolled_roles);

    for(let i=0;i<rolled_roles.length;i++){
      let player = new Player(this.game,i+1,players[i],new Role(rolled_roles[i]));
      this.game.pushPlayer(player);
      this.game.setGuild(players[i].guild);
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

  async createGameRole(){

    const guild = this.game.getGuild();
    
    const gameRole = await guild.roles.create({
      name: 'Salem',
      color: '#0f0f0f',
      permissions:[]
    });
    this.game.setGameKey(gameRole);

  }

  async distributeGameRole(){
    const key = this.game.getGameKey();
    this.game.getPlayers().map(player => player.getDiscord().roles.add(key));
  }


}
