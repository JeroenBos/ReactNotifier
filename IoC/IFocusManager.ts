import * as ReactDOM from 'react-dom';


export interface IFocusManager {
    focus(element: React.ReactInstance): void;
    readonly focusOnEquationOnMount: boolean;
}

/**
 * The default/production focus manager.
 */
export class FocusManager implements IFocusManager {
    readonly focusOnEquationOnMount: boolean = true;
    focus(element: React.ReactInstance) {
        focusOn(element);
    }
}
/**
 * Tries to focus on the specified react element.
 */
export function focusOn(element: React.ReactInstance) {
    const domNode = ReactDOM.findDOMNode(element);
    if (domNode !== null) {
        (domNode as any).focus();
    }
}