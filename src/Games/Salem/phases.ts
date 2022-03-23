export type PhasePossibilities = 
'Lobby' | 'Start' |'Reporting' | 'Reporting Calculation' |'Discussion' | 'Voting' | 
'Defense' | 'Judgement' |
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
  readonly showPhaseMenu: boolean,
}

const phases:readonly Phase[] = [
  {
    name: 'Lobby',
    duration: 60,
    next: { normal: 'Start', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
    showPhaseMenu: false,
  },
  {
    name: 'Start',
    duration: 0,
    next: { normal: 'Discussion', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Reporting',
    duration: 0,
    next: { normal: 'Reporting Calculation', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: false,
    showPhaseMenu: false,
  },
  { 
    name: 'Reporting Calculation',
    duration: 0,
    next: { normal: 'Discussion', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Discussion',
    duration: 35,
    next: { normal: 'Voting', special: 'Night' },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
    showPhaseMenu: true,
  },
  {
    name: 'Voting',
    duration: 20,
    next: { normal: 'Night', special: 'Defense' },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: true,
    showPhaseMenu: true,
  },
  {
    name: 'Defense',
    duration: 15,
    next: { normal: 'Judgement', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
    showPhaseMenu: false,
  },
  {
    name: 'Judgement',
    duration: 15,
    next: { normal: 'Judgement Calculation', special: null },
    canTalk: false,
    shouldLockChannel: true,
    remindTime: true,
    showPhaseMenu: false,
  },
  {
    name: 'Judgement Calculation',
    duration: 0,
    next: { normal: 'Night', special: 'Final Words' },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Final Words',
    duration: 15,
    next: { normal: 'Execution', special: null },
    canTalk: true,
    shouldLockChannel: true,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Execution',
    duration: 0,
    next: { normal: 'Execution Calculation', special: null },
    canTalk: true,
    shouldLockChannel: true,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Execution Calculation',
    duration: 0,
    next: { normal: 'Night', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Night',
    duration: 20,
    next: { normal: 'Night Calculation', special: null },
    canTalk: false,
    shouldLockChannel: false,
    remindTime: true,
    showPhaseMenu: true,
  },
  {
    name: 'Night Calculation',
    duration: 0,
    next: { normal: 'Reporting', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: false,
    showPhaseMenu: false,
  },
  {
    name: 'Game Over',
    duration: 0,
    next: { normal: 'Lobby', special: null },
    canTalk: true,
    shouldLockChannel: false,
    remindTime: true,
    showPhaseMenu: false,
  }
]

export default phases