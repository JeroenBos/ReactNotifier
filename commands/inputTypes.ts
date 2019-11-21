export type InputEvent = { stopPropagation: () => void };

/** Represent once-computed data for the execution of a command, also sent to the server.
 * That's the most important point: the event input is not send. CommandParameter also isn't */
export type CommandState = any;

/** Represents any input a command may like the input event, can can be anything. Will not be propagated to the server. */
export type CommandParameter = any;
