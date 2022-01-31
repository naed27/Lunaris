export type PhasePossibilities = 
'Lobby' | 'Reporting' | 'Reporting Calculation' |'Discussion' | 'Voting' | 
'Voting Calculation' | 'Defense' | 'Judgement' |
'Judgement Calculation' | 'Final Words' | 'Execution' | 
'Execution Calculation' | 'Night' | 'Night Calculation' | 
'Game Over'

export interface Phase{
  readonly name: PhasePossibilities,
  readonly duration: number,
  readonly next: {
    normal: PhasePossibilities,
    special: PhasePossibilities | null
  },
  readonly canTalk: boolean,
  readonly shouldLockChannel: boolean,
  readonly remindTime: boolean,
}

const phases:readonly Phase[] = [
  {
    name: 'Lobby',
    duration: 20,
    next: { normal: 'Reporting', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Reporting',
    duration: 60,
    next: {normal: 'Reporting Calculation', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Reporting Calculation',
    duration: 20,
    next: {normal: 'Discussion', special: null},
    canTalk: false,
    shouldLockChannel:true,
    remindTime: true
  },
  {
    name: 'Discussion',
    duration: 0,
    next: {normal: 'Voting', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Voting',
    duration: 0,
    next: {normal: 'Voting Calculation', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Voting Calculation',
    duration: 0,
    next: {normal: 'Defense', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Defense',
    duration: 0,
    next: {normal: 'Judgement', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Judgement',
    duration: 0,
    next: {normal: 'Judgement Calculation', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Judgement Calculation',
    duration: 0,
    next: {normal: 'Final Words', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Final Words',
    duration: 0,
    next: {normal: 'Execution', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Execution',
    duration: 0,
    next: {normal: 'Execution Calculation', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Execution Calculation',
    duration: 0,
    next: {normal: 'Night', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Night',
    duration: 0,
    next: {normal: 'Night Calculation', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  },
  {
    name: 'Night Calculation',
    duration: 0,
    next: {normal: 'Reporting', special: null},
    canTalk: true,
    shouldLockChannel:false,
    remindTime: true
  }
]

export default phases