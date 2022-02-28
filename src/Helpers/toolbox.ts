import { MessageEmbed,ColorResolvable } from 'discord.js';

export const parseCommand = (PREFIX:string,message:string, argsSpliter = ' ') =>{
  const [COMMAND, ...rawArgs] = message.slice(PREFIX.length).split(' ');
  const ARGS = rawArgs.join(' ').split(argsSpliter);
  return { COMMAND, ARGS };
}

export const splitStringByLineBreak = (message:string) =>{
  return message.split('\n');
}

export const splitStringBySpaces = (message:string) =>{
  return message.split(/\s+/);
}

export const splitStringByComma = (message:string)=>{
  const [...blargs] = message.split(',');

  for (let i = 0; i < blargs.length; i++) {
    if(blargs[i].charAt(0)==" "){
      blargs[i] = blargs[i].substring(1);
    }
  }
  return blargs;
}

export const getMapSize = (map:any) =>{
  let size=0;
  map.forEach(() => {
    size++;
  });
  return size;
}

export const getCurrentTime = () =>{
  return Math.floor(Date.now()/1000);
}

export const delay = async (milliseconds:number) =>{ 
  return new Promise(res=>setTimeout(res, milliseconds));
}

export const sortWordsAlphabetically = (words:string[])=>{
  const sortedWords = words.sort();
  return sortedWords;
}

export const sortNumbersAscending = (numbers:number[]) =>{
  const sortedNumbers = numbers.sort((a,b)=>a-b);
  return sortedNumbers;
}

export const sortNumbersDescending = (numbers:number[]) =>{
  const sortedNumbers = numbers.sort((a,b)=>b-a);
  return sortedNumbers;
}

export const stringContainsKeyword = (mainWord:string,keyword:string) =>{
  const result = mainWord.toLowerCase().includes(keyword.toLowerCase());
  return result;
}

export const stringContainsInitials = (fullName:string,initials:string) =>{
  const nameInitials = fullName.split(' ').map(name=>name.charAt(0)).join('');
  const result = stringContainsKeyword(nameInitials,initials);
  return result;
}

export const stringStartsWithKeyword = (string:string,keyword:string) =>{
  const result = string.toLocaleLowerCase().startsWith(keyword.toLowerCase());
  return result;
}

export const getStringSearchResults=(arrayOfWords: string[],keyword:string): string[] => {

  const startWiths = [];
  const keysFound = [];
  const initialsFound = [];

  arrayOfWords.map((mainWord)=>{
    if(stringStartsWithKeyword(mainWord,keyword))return startWiths.push(mainWord);
    if(stringContainsKeyword(mainWord,keyword))return keysFound.push(mainWord);
    if(stringContainsInitials(mainWord,keyword))return initialsFound.push(mainWord);
  })

  if(startWiths.length>1)return startWiths
  if(keysFound.length>1)return keysFound
  if(initialsFound.length>1)return initialsFound

  return [];
}

export const arrayContainsElement = (array:any[],element:any) =>{
  const result = array.includes(element);
  return result;
}

export const removeDuplicates = <Type>(array:Type[]):Type[]=>{
  const result:Type[] = [];
  array.forEach((element)=>{
    if(!result.includes(element)){
      result.push(element);
    }
  })
  return result;
}

export const shuffleArray=<T>(array:T[])=>{
  let currentIndex = array.length;
  let temporaryValue:any;
  let randomIndex:number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

  // Pick a remaining element...
  randomIndex = Math.floor(Math.random() * currentIndex);
  currentIndex -= 1;

  // And swap it with the current element.
  temporaryValue = array[currentIndex];
  array[currentIndex] = array[randomIndex];
  array[randomIndex] = temporaryValue;
  }

  return array;
}


export const stringifyArrayOfNames = (arrayOfNames:string[])=>{
  const result = arrayOfNames.slice(0,arrayOfNames.length-1).join(', ') + ', and ' + arrayOfNames.slice(-1);
  return result;
}

export const createEmbed = ({
  title='',
  description='',
  color=`#000000`,
  author='',
  footer=''
}:{
  title?:string,
  description?:string,
  color?:ColorResolvable,
  author?:string,
  footer?:string
}) => {

  const embed = new MessageEmbed()
  .setTitle(title)
  .setDescription(description)
  .setColor(color)
  .setAuthor(author)
  .setFooter(footer);

  return embed;
} 


export const jsonWrap = (message:string)=>{
  const wrapper = `\`\`\``;
  const format = `json\n`;
  const linebreak = `‎`

  const result = `${linebreak}${wrapper}${format}${message}${wrapper}`;

  return result;
}




