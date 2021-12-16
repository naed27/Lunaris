export type PhasePossibilities = "Lobby" | "Question" | "Answer" | "Turn Result" | "Calculation";

export interface Phase{
  readonly name: PhasePossibilities,
  readonly duration: number,
  readonly next: PhasePossibilities,
  readonly shouldLockChannel: boolean
}

const phases:readonly Phase[] = [
  {
    name: "Lobby",
    duration: 20,
    next: "Question",
    shouldLockChannel:false,
  },
  {
    name: "Question",
    duration: 60,
    next: "Answer",
    shouldLockChannel:false,
  },
  {
    name: "Answer",
    duration: 20,
    next: "Turn Result",
    shouldLockChannel:true,
  },
  {
    name: "Turn Result",
    duration: 0,
    next: "Calculation",
    shouldLockChannel:false,
  },
  {
    name: "Calculation",
    duration: 0,
    next: "Lobby",
    shouldLockChannel:false,
  }
]

export default phases