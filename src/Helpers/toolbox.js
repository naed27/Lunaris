const util = exports

// returns the command name and its arguments

util.parseCommand = (prefix,message) =>{
  const [cmd, ...args] = message
  .substring(prefix.length)
  .split(' ');
  return [cmd,args];
  // note: cmd is an element, args is an array
}


// returns an array of words splitted by linebreaks

util.splitByLineBreak = (message) =>{
  let [...blargs] = message
  .split('\n');
  return blargs;
}


// returns an array of words splitted by spaces

util.splitBySpaces = (message) =>{
  let [...blargs] = message
  .split(/\s+/);
  return blargs;
}


// returns an array of words splitted by commas

util.splitByComma = (message)=>{
  let [...blargs] = message
  .split(',');
  for (let i = 0; i < blargs.length; i++) {
      if(blargs[i].charAt(0)==" "){
          blargs[i] = blargs[i].substring(1);
      }
  }
  return blargs;
}


// returns the size of the map

util.getMapSize = (map) =>{
  let size=0;
  map.forEach(() => {
      size++;
  });
  return size;
}


// returns time into 00:00 AM or PM format

util.AMPMformat = (hrs,min) => {
  let hours = hrs;
  let minutes = min;
  let ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  // minutes = minutes < 10 ? '0'+minutes : minutes;
  let strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}


// returns current time

util.currentTime=()=>{
  return Math.floor(Date.now()/1000);
}


// returns a delayed response (for process blocking)

util.delay = async (ms) =>{ 
  return new Promise(res=>setTimeout(res, ms));
}


// returns an alphabetically sorted word array

util.sortAlphabetically=(words)=>{

  for(let i=1;i<words.length;i++){
      let word1 = words[i];
      let lim;
      let limword;
      comparer:for(let j=i-1;j>=0;j--){
          let word2=words[j];
          if(word1.length<word2.length){
               lim = word1.length;
               limword = word1;
          }else{
               lim = word2.length;
               limword = word2;
          }
          for(let k=0;k<lim;k++){
              if(word1[k]<word2[k]){
                  words[j]=word1;
                  words[i]=word2;
                  i--;
                  break;
              }else if(word1[k]==word2[k]){
                  if(k==lim-1&&limword==word1){
                      words[j]=word1;
                      words[i]=word2;
                      i--;
                  }
              }else if(word1[k]>word2[k]){
                  break comparer;
              }
          }
      }
  }
  return words;
}


// returns an ascending number array

util.sortAscending=(numbers)=>{
  for(let i=1;i<numbers.length;i++){
      let second = numbers[i];
      for (let j = i-1; j >= 0 ; j--) {
          let first = numbers[j];
          if(second<first){
              let temp = numbers[i];
              numbers[i] = numbers[j];
              numbers[j] = temp;
              i-=2;
          }
          break;
      }
  }
  return numbers;
}


// returns true if keyword is found within the mainword

util.containsKeyword = (mainword,keyword) =>{
  if(typeof mainword !== "string" && typeof keyword !== "string")
  return false

  let x=0;
  mainword = mainword.toLowerCase().replace(/\s+/g, '');
  keyword = keyword.toLowerCase().replace(/\s+/g, '');
  for (let i = 0; i < mainword.length; i++) {
      if(mainword[i]==keyword[x]){
      x++;
      if(x==keyword.length){
          return true;}
      }else{
      x=0;
      }
  }
  return false;
}


// returns true if the inputed initials are found withing the mainword

util.containsInitials = (word,keyInitials) =>{
        
  if(typeof word !== "string" && typeof initials !== "string")
    return false;

  let initials="";
  let names = word.split(' ');
  names.forEach(n => {
      initials+=`${n.charAt(0)}`;
  });

  if(this.containsKeyword(initials,keyInitials)){
      return true;
  }
  return false;
}


// returns the matched words if the function found some. returns false if no

util.findWord=(arrayOfWords,keyword)=>{
  let filtered = [];
  let startWiths = arrayOfWords.filter(mainWord=>mainWord.toLowerCase().startsWith(keyword.toLowerCase()));
  let keysFound = arrayOfWords.filter(mainWord=>this.containsKeyword(mainWord,keyword));
  let initialsFound = arrayOfWords.filter(mainWord=>this.containsInitials(mainWord,keyword));
  
  if(startWiths.length>1){
      filtered.push(...startWiths);
      return filtered;
  }else{
    if(keysFound.length>1){
      filtered.push(...keysFound)
      return filtered;
    }else{
      if(initialsFound.length>1){
        filtered.push(...initialsFound)
        return filtered;
      }
    }
  }
  return false;
}


// returns true if an element is found within the array

util.containsElement=(array,element)=>{
  let res = array.filter(e=>e==element);
  if(res.length>0){
      return true;
  }else{
      return false;
  }
}


// returns a uniquely ordered array

util.uniqueFilter=(array)=>{
  let uniques = []
  array.forEach(element => {
    const checker = uniques.filter((uniqueElement)=>uniqueElement == element);
    if(checker.length===0)
      uniques.push(element);
  });
  return uniques;
}

util.shuffleArray=(array)=>{
  let currentIndex = array.length, temporaryValue, randomIndex;

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


util.stringifyArrayOfNames = (arrayOfNames)=>{
  let result ="";

  for (let i = 0; i < arrayOfNames.length; i++) {
    result+=`**${arrayOfNames[i]}**`;
    if(i<arrayOfNames.length-1){
        result+=`, `;
      if(i==arrayOfNames.length-2){
        result+=`and `;
      }
    }
  }

  return result;
}





