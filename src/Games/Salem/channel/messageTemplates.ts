import { createEmbed } from "../../../Helpers/toolbox";
import Game from "../game";


export const createJudgementCard = (game:Game) =>{
  
  const accused = game.getVotedUp().getUsername();

  const title = `⚖️ The Judgement`;
  const description = `Accused: ${accused}\n\n`;

  return createEmbed({title,description});
}
