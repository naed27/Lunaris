import Game from "../game"
import Player from "../player"

export default ({game, player}:{game: Game, player: Player}) => {
  return [
    //----------------------------------------
    `**Town Of Salem**
    `,

    //----------------------------------------
    `**Profile**\n\nName: ${player.getDiscord().user.username}\nUsername: ${player.getUsername()}\nStatus: ${player.getStatus()}\nRole: ${player.getRole().getName()}\nAbilities: ${player.getRole().getAbilities().join("\n")}\nSkill Commands: ${player.getRole().getCommands().filter(c=>c.getType()==='Skill Command').map((c)=> `${c.getName()}`).join(', ')}\nHow to Win: ${player.getRole().getGoals().join("\n")}\n`,

    //----------------------------------------
    `Type ".changename <new name>" to change your in-game name."`,

    //----------------------------------------
    `**Town Of Salem**`,

    //----------------------------------------
  
  ]
}
