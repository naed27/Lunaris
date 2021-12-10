import { Message } from "discord.js";
import math from "mathjs";


export function reactoToMessage(message:Message) {
    const msg = message.content.toLowerCase();

    if(msg==='hello')return message.react('👋');
    if(msg==='hi')return message.react('👋');

    if(msg==='true' || msg==='false')return
    try{const mathResult = math.evaluate(msg);
    if(math.evaluate(msg) !== msg)return
    return message.channel.send(mathResult);}catch{}
}
