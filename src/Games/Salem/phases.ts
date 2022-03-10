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
    next: { normal: 'Discussion', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
  },
  {
    name: 'Reporting',
    duration: 0,
    next: { normal: 'Reporting Calculation', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: false,
  },
  { 
    name: 'Reporting Calculation',
    duration: 0,
    next: { normal: 'Discussion', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
  },
  {
    name: 'Discussion',
    duration: 35,
    next: { normal: 'Night', special: 'Voting' },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
  },
  {
    name: 'Voting',
    duration: 20,
    next: { normal: 'Voting Calculation', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: true,
  },
  {
    name: 'Voting Calculation',
    duration: 0,
    next: { normal: 'Defense', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: false,
  },
  {
    name: 'Defense',
    duration: 15,
    next: { normal: 'Judgement', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
  },
  {
    name: 'Judgement',
    duration: 15,
    next: { normal: 'Judgement Calculation', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: true,
  },
  {
    name: 'Judgement Calculation',
    duration: 0,
    next: { normal: 'Final Words', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
  },
  {
    name: 'Final Words',
    duration: 0,
    next: { normal: 'Execution', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: true,
  },
  {
    name: 'Execution',
    duration: 0,
    next: { normal: 'Execution Calculation', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: false,
  },
  {
    name: 'Execution Calculation',
    duration: 0,
    next: { normal: 'Night', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
  },
  {
    name: 'Night',
    duration: 20,
    next: { normal: 'Night Calculation', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: true,
  },
  {
    name: 'Night Calculation',
    duration: 0,
    next: { normal: 'Reporting', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: false,
  },
  {
    name: 'Game Over',
    duration: 0,
    next: { normal: 'Lobby', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
  }
]

export default phases