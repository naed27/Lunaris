import Game from "./game";
import Player from "./player";
import roles from "./roles";
import { shuffleArray } from '../../Helpers/toolbox';

export default class Setup{

  game: Game;

  constructor(game: Game){
    this.game = game;
  }

  async setupPlayers(){
    
    const players = shuffleArray([...this.game.getHost().getJoinedPlayers()]);
    
    const ghostCount = this.game.getNumberOfGhosts();
    const studentCount = players.length - ghostCount;

    const gameRoles = shuffleArray([
      ...this.getCopyOfRole('Ghost',ghostCount),
      ...this.getCopyOfRole('Student',studentCount)
    ]);
    
    for (let i = 0; i < gameRoles.length; i++) {
      const channel = await this.createChannel()
      const player = new Player({
        game: this.game,
        channel: channel,
        discord: players[i],
        listnumber: i+1,
        role: gameRoles[i]
      });
      this.game.connectPlayer(player);
    }
  }

  createChannel = async () => {
    const guild = this.game.getGuild();

    const channel = await guild.channels.create(`🌹﹕salem`, {
      type: 'GUILD_TEXT',
      permissionOverwrites: [
        {
          id: guild.roles.everyone, 
          allow: [],
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        },
      ],
    })

    return channel
  }

  createGameRole = async () => {
    const guild = this.game.getGuild();
    const gameRole = await guild.roles.create({
      name: 'Salem',
      color: '#0f0f0f',
      permissions:[]
    });
    this.game.setGameKey(gameRole);
  }

  distributeGameRole = () => {
    this.game.getPlayers().map(player => player.getDiscord().roles.add( this.game.getGameKey() ));
  }

  // setupPlayerCollectors = async () => this.game.getPlayers().map(p => p.setupCollector());
  lockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().lock());
  unlockPlayerChannels = async () => this.game.getPlayers().map((p)=>p.getChannelManager().unlock());
  showPlayerChannels = async () => this.game.getPlayers().map(async p => p.getChannelManager().show(p.getId()));

  getCopyOfRole = (roleName: string, quantity: number) => {
    let gameRoles=[];
    for (let i = 0; i < quantity; i++) {
      gameRoles = [...gameRoles,...roles.filter((role)=>role.name === roleName)];
    }
    return gameRoles
  }

}