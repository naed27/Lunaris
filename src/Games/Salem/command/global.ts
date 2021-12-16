import Command from './command';
import { Command as globalCommand } from '../commands';

export default class GlobalAbility extends Command{

  process: any

  constructor( command: globalCommand ){
    super(command);

    this.process=command.process;
  }

  // -------------------- Setters and Getters



}
