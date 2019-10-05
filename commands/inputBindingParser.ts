import { Key } from "ts-keycode-enum";

export type CanonicalInputBinding = string;

export namespace CanonicalInputBinding {
    export function fromKeyboardEvent(e: React.KeyboardEvent, kind: Kind.Down | Kind.Up): CanonicalInputBinding {
        return toCanonicalKeyboardRepresentation(<Key>e.which, kind, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey, e.repeat);
    }
    export function fromMouseEvent(e: React.MouseEvent, kind: Kind): CanonicalInputBinding {
        return toCanonicalMouseRepresentation(<MouseButton>e.button, kind, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    }

    export function fromMouseMoveEvent(e: React.MouseEvent): CanonicalInputBinding {
        return mouseMovementToCanonicalMouseMovement(e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    }

    export function toCanonicalKeyboardRepresentation(
        key: Key,
        kind: Kind = Kind.Down,
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false,
        repeat: boolean) {
        return '';
    }
    export function toCanonicalMouseRepresentation(
        button: MouseButton,
        kind: Kind = Kind.Down,
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false) {
        return '';
    }
    export function mouseMovementToCanonicalMouseMovement(
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false) {
        return '';
    }
    export function parse(s: string) {
        return s;
    }
    export function setIsHandled() {

    }
}

enum MouseButton {
    /** usually the left button or the un-initialized state */
    Main,
    /** usually the wheel button or the middle button (if present) */
    Auxillary,
    /** usually the right button */
    Secondary,
    BrowserBack,
    BrowserFoward
}
class Scroll {
    public constructor(public readonly direction: ScrollDirection) {
    }
}
enum ScrollDirection {
    Vertical,
    Horizontal
}
export enum Kind {
    /** Represents a keyboard press event, or a mouse button click event. */
    Down,
    /** Represents a keyboard up release event, or a mouse button release event. */
    Up,
    /** Represents a left mouse button click and release event. */
    Click
}