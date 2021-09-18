const util = exports;
const {MessageEmbed} = require('discord.js');
const Lwrap = `‎\n\`\`\`json\n`;
const Rwrap = `\`\`\``;


util.createEmbed = ({author='',title='',body='',footer=''})=>{
  return new MessageEmbed()
  .setColor("#000000")
  .setAuthor(`${author}`)
  .setTitle(`${title}`)
  .setDescription(`${body}`)
  .setFooter(`${footer}`);
}

util.wrap = (message)=>{
  return `${Lwrap}${message}${Rwrap}`
}

util.arrangeActions=(actions)=>{
  for(let i=1;i<actions.length;i++){
      const second = actions[i].command.Priority;
      for (let j = i-1; j >= 0 ; j--) {
          const first = actions[j].command.Priority;
          if(second<first){
              let temp = actions[i];
              actions[i] = actions[j];
              actions[j] = temp;
              i-=2;
          }
          break;
      }
  }
  return actions;
}

util.concatNotifs = (arrayOfNotifs)=>{
  let result = "";
  for (let i = 0; i < arrayOfNotifs.length; i++) {
    result += `${arrayOfNotifs[i].player}`;
      if(i<arrayOfNotifs.length-1){
        result+=`\n`;
      }
  }
  return {content:this.wrap(result)};
}


util.parseDiary = (player)=>{
  const fullDiaryContent = player.getDiaryLogs().join('\n\n');
  const diaryLines = fullDiaryContent.split('\n');

  let line=0;
  let pages = [];
  let page = '';
  for (let i = 0; i < diaryLines.length; i++) {
    if(line<5)
      page += diaryLines[i]+'\n';
    pages.push(page);
    page='';
    line=0;
  }
  
  return pages;
}