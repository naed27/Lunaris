import { runFunc, callResponseFunc, defaultTargetFunc, performerFunc, SalemCommand, targetablesFunc, visitsTargetFunc, Queue, RolePermission } from './roles';

export default class Command{

  name: string;
  guide: string;
  description: string;
  priority: number;
  stocks: number;
  permission: RolePermission;
  queue: Queue;
  phase: string[];
  requiredStatus: string[];
  targetCount: number;
  lethal: boolean;

  readonly hasMenuStatus: boolean;
  readonly hasArgumentsStatus: boolean;
  readonly inputSeparator: string;

  run: runFunc; 
  performer: performerFunc;
  visitsTarget: visitsTargetFunc;
  targetables: targetablesFunc;
  defaultTarget: defaultTargetFunc;
  callResponse: callResponseFunc;

  constructor( command: SalemCommand ){
    this.name = command.name;
    this.guide = command.guide;
    this.description = command.description;
    this.priority = command.priority;
    this.stocks = command.stocks;
    this.permission = command.permission;
    this.queue = command.queue;
    this.targetCount = command.targetCount;
    this.phase = command.phase;
    this.requiredStatus = command.requiredStatus;
    this.lethal = command.lethal;
    this.hasMenuStatus = command.hasMenu;
    this.hasArgumentsStatus = command.hasArguments;
    this.inputSeparator = command.inputSeparator;

    this.run = command.run;
    this.performer = command.performer;
    this.visitsTarget = command.visitsTarget;
    this.targetables = command.targetables;
    this.defaultTarget = command.defaultTarget;
    this.callResponse = command.callResponse;
  }

  // ------------------------------------- SETTERS AND GETTERS

  hasMenu = () => this.hasMenuStatus;
  hasArguments = () => this.hasArgumentsStatus;
  getInputSeparator = () => this.inputSeparator;

  isLethal = () => this.lethal;

  getPhases = () => this.phase
  getRequiredStatus = () => this.requiredStatus

  getQueue = () => this.queue;
  setQueue = (a: Queue) => this.queue=a;  

  getName = () => this.name;
  setName = (a: string) => this.name = a;

  getGuide = () =>  this.guide;
  setGuide = (a: string) => this.guide = a;
  
  getStocks = () => this.stocks;
  setStocks = (a:number) => this.stocks = a;
  decrementStock = () => this.stocks>0 && this.stocks--;
  incrementStock = () => this.stocks<99 && this.stocks++;

  getPriority = () => this.priority;
  setPriority = (a: number) => this.priority = a;

  getPermission = () => this.permission;
  setPermission = (a: RolePermission) => this.permission = a;

  getDescription = () => this.description;
  setDescription = (a: string) => this.description = a;

  getTargetCount = () => this.targetCount
  setTargetCount = (a: number) => this.targetCount = a;

}
