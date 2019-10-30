export type InputEvent = { stopPropagation: () => void };

/** Represent once-computed data for the execution of a command, also sent to the server.
 * That's the most important point: the event input is not send. CommandParameter also isn't */ 
export type CommandState = any;

/** Represents any input a command may have other than its input event. */
export type CommandParameter = any;
