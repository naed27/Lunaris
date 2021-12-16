import { SalemRoleCommand } from '../roles';
import { Command as GlobalCommand } from '../commands';
export default class Command{

  name: string;
  guide: string;
  description: string;
  priority: number;
  stocks: number;
  permission: string;
  queue: string;
  phase: string[];
  status: string;
  requiredTargets: number;

  constructor( command: SalemRoleCommand | GlobalCommand ){
    this.name = command.name;
    this.guide = command.guide;
    this.description = command.description;
    this.priority = command.priority;
    this.stocks = command.stocks;
    this.permission = command.permission;
    this.queue = command.queue;
    this.requiredTargets = command.requiredTargets;
    this.phase = command.phase;
    this.status = command.status;
  }

  // ------------------------------------- SETTERS AND GETTERS

  getPhase = () => this.phase
  getStatus = () => this.status

  getQueue = () => this.queue;
  setQueue = (a: string) => this.queue=a;  

  getName = () => this.name;
  setName = (a: string) => this.name = a;

  getGuide = ()=>  this.guide;
  setGuide = (a: string) => this.guide = a;
  
  getStocks = () => this.stocks;
  setStocks = (a:number) => this.stocks = a;
  
  getPriority = () => this.priority;
  setPriority = (a: number) => this.priority=a;

  getPermission = () => this.permission;
  setPermission = (a: string) => this.permission=a;

  getDescription = () => this.description;
  setDescription = (a: string) => this.description=a;

  getRequiredTargets = () => this.requiredTargets
  setRequiredTargets = (a: number) => this.requiredTargets=a

}
