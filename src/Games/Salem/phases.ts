export type PhasePossibilities = 
"Lobby" | "Reporting" | "Discussion" | "Voting" | 
"Voting Calculation" | "Defense" | "Judgement" |
"Judgement Calculation" | "Final Words" | "Execution" | 
"Execution Calculation" | "Night" | "Night Calculation" | 
"Game Over"

export interface Phase{
  readonly name: PhasePossibilities,
  readonly duration: number,
  readonly next: {
    normal: PhasePossibilities,
    special: PhasePossibilities|null
  },
  readonly shouldLockChannel: boolean,
  readonly remindTime: boolean,
}

const phases:readonly Phase[] = [
  {
    name: "Lobby",
    duration: 20,
    next: { normal: "Discussion", special: null },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Reporting",
    duration: 20,
    next: { normal: "Discussion", special: null },
    shouldLockChannel:false,
    remindTime: false,
  },
  {
    name: "Discussion",
    duration: 60,
    next: { normal: "Night", special: "Voting" },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Voting",
    duration: 20,
    next: { normal: "Voting Calculation", special: null },
    shouldLockChannel:true,
    remindTime: true,
  },
  {
    name: "Voting Calculation",
    duration: 20,
    next: { normal: "Defense", special: null },
    shouldLockChannel:true,
    remindTime: false,
  },
  {
    name: "Defense",
    duration: 0,
    next: { normal: "Judgement", special: null },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Judgement",
    duration: 0,
    next: { normal: "Judgement Calculation", special: null },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Judgement Calculation",
    duration: 0,
    next: { normal: "Final Words", special: null },
    shouldLockChannel:false,
    remindTime: false,
  },
  {
    name: "Final Words",
    duration: 0,
    next: { normal: "Execution", special: null },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Execution",
    duration: 0,
    next: { normal: "Execution Calculation", special: null },
    shouldLockChannel:false,
    remindTime: false,
  },
  {
    name: "Execution Calculation",
    duration: 0,
    next: { normal: "Night", special: null },
    shouldLockChannel:false,
    remindTime: false,
  },
  {
    name: "Night",
    duration: 0,
    next: { normal: "Night Calculation", special: null },
    shouldLockChannel:false,
    remindTime: true,
  },
  {
    name: "Night Calculation",
    duration: 0,
    next: { normal: "Discussion", special: null },
    shouldLockChannel:false,
    remindTime: false,
  },
  {
    name: "Game Over",
    duration: 0,
    next: { normal: "Lobby", special: null },
    shouldLockChannel:false,
    remindTime: true,
  }
]

export default phases