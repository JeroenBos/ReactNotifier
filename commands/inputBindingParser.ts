import { Key } from 'ts-keycode-enum';
import { isNumber } from 'util';
import { assert } from 'jbsnorro';

export type CanonicalInputBinding = string;

export namespace CanonicalInputBinding {
    export function fromKeyboardEvent(e: React.KeyboardEvent, kind: Kind.Down | Kind.Up): CanonicalInputBinding {
        return toCanonicalKeyboardRepresentation(e.which || e.keyCode, kind, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey, e.repeat);
    }
    export function fromMouseEvent(e: React.MouseEvent, kind: Kind): CanonicalInputBinding {
        return toCanonicalMouseRepresentation(e.button, kind, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
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
        assert(isNumber(key), `argument error 'key'`);

        const result = sharedToCanonical(shiftDown, ctrlDown, altDown, commandDown)
            + keyToString(key)
            + (kind == Kind.Up ? ' up' : '')
            + (repeat ? ' (repeat)' : '');
        return result;
    }
    export function mouseButtonToString(button: MouseButton): string {
        switch (button) {
            case MouseButton.Main: return 'left';
            case MouseButton.Auxillary: return 'middle';
            case MouseButton.Secondary: return 'right';
            case MouseButton.BrowserBack: return 'back-button';
            case MouseButton.BrowserFoward: return 'forward-button';
            default:
                return 'unknown-button';
        }
    }
    export function keyToString(key: Key): string {
        switch (key) {
            case Key.Backspace: return 'backspace';
            case Key.Tab: return 'tab';
            case Key.Enter: return 'rnter';
            // case Key.Shift: 'Shift';
            // case Key.Ctrl: 'Ctrl';
            // case Key.Alt: 'Alt';
            case Key.PauseBreak: return 'break';
            case Key.CapsLock: return 'capslock';
            case Key.Escape: return 'escape';
            case Key.Space: return 'space';
            case Key.PageUp: return 'pageup';
            case Key.PageDown: return 'pagedown';
            case Key.End: return 'end';
            case Key.Home: return 'home';
            case Key.LeftArrow: return 'leftarrow';
            case Key.UpArrow: return 'uparrow';
            case Key.RightArrow: return 'rightarrow';
            case Key.DownArrow: return 'downarrow';
            case Key.Insert: return 'insert';
            case Key.Delete: return 'delete';
            case Key.Zero: return '0';
            case Key.ClosedParen: return ')';
            case Key.One: return '1';
            case Key.ExclamationMark: return '!';
            case Key.Two: return '2';
            case Key.AtSign: return '@';
            case Key.Three: return '3';
            case Key.PoundSign: return '#';
            case Key.Hash: return '%';
            case Key.Four: return '4';
            case Key.DollarSign: return '$';
            case Key.Five: return '5';
            case Key.PercentSign: return '%';
            case Key.Six: return '6';
            case Key.Caret: return '^'; // case Key.Hat: '^'; duplicate
            case Key.Seven: return '7';
            case Key.Ampersand: return '&';
            case Key.Eight: return '8';
            case Key.Star: return '*'; // case Key.Asterik: '*'; // duplicate
            case Key.Nine: return '9';
            case Key.OpenParen: return '(';
            case Key.A: return 'a';
            case Key.B: return 'b';
            case Key.C: return 'c';
            case Key.D: return 'd';
            case Key.E: return 'e';
            case Key.F: return 'f';
            case Key.G: return 'g';
            case Key.H: return 'h';
            case Key.I: return 'i';
            case Key.J: return 'j';
            case Key.K: return 'k';
            case Key.L: return 'l';
            case Key.M: return 'm';
            case Key.N: return 'n';
            case Key.O: return 'o';
            case Key.P: return 'p';
            case Key.Q: return 'q';
            case Key.R: return 'r';
            case Key.S: return 's';
            case Key.T: return 't';
            case Key.U: return 'u';
            case Key.V: return 'v';
            case Key.W: return 'w';
            case Key.X: return 'x';
            case Key.Y: return 'y';
            case Key.Z: return 'z';
            case Key.LeftWindowKey: return 'left-win';
            case Key.RightWindowKey: return 'right-win';
            case Key.SelectKey: return 'select';
            case Key.Numpad0: return 'numpad0';
            case Key.Numpad1: return 'numpad1';
            case Key.Numpad2: return 'numpad2';
            case Key.Numpad3: return 'numpad3';
            case Key.Numpad4: return 'numpad4';
            case Key.Numpad5: return 'numpad5';
            case Key.Numpad6: return 'numpad6';
            case Key.Numpad7: return 'numpad7';
            case Key.Numpad8: return 'numpad8';
            case Key.Numpad9: return 'numpad9';
            case Key.Multiply: return 'numpad*';
            case Key.Add: return 'numpad+';
            case Key.Subtract: return 'numpad-';
            case Key.DecimalPoint: return 'numpad.';
            case Key.Divide: return 'numpad/';
            case Key.F1: return 'F1';
            case Key.F2: return 'F2';
            case Key.F3: return 'F3';
            case Key.F4: return 'F4';
            case Key.F5: return 'F5';
            case Key.F6: return 'F6';
            case Key.F7: return 'F7';
            case Key.F8: return 'F8';
            case Key.F9: return 'F9';
            case Key.F10: return 'F10';
            case Key.F11: return 'F11';
            case Key.F12: return 'F12';
            case Key.NumLock: return 'numlock';
            case Key.ScrollLock: return 'scrolllock';
            case Key.SemiColon: return ';';
            case Key.Equals: return '=';
            case Key.Comma: return ',';
            case Key.Dash: return '-';
            case Key.Period: return '.';
            case Key.UnderScore: return '_';
            case Key.PlusSign: return '+';
            case Key.ForwardSlash: return '/';
            case Key.Tilde: return '~';
            case Key.GraveAccent: return '`';
            case Key.OpenBracket: return '[';
            case Key.ClosedBracket: return ']';
            case Key.Quote: return '\'';
            default:
                return key as any;
        }
    }
    export function toCanonicalMouseRepresentation(
        button: MouseButton,
        kind: Kind = Kind.Down,
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false,
        repeat: boolean = false) {

        const result = sharedToCanonical(shiftDown, ctrlDown, altDown, commandDown)
            + mouseButtonToString(button)
            + (kind == Kind.Up ? '-release' : (repeat ? '-doubleclick' : '-click'))
        return result;
    }
    export function mouseMovementToCanonicalMouseMovement(
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false) {
        const result = sharedToCanonical(shiftDown, ctrlDown, altDown, commandDown)
            + 'mousemove';
        // TODO: add more
        return result;
    }
    function sharedToCanonical(
        shiftDown: boolean = false,
        ctrlDown: boolean = false,
        altDown: boolean,
        commandDown: boolean = false) {
        let result = '';
        if (ctrlDown)
            result += 'ctrl+';
        if (altDown)
            result += 'alt+';
        if (commandDown)
            result += '(cmd/win/meta)+';
        if (shiftDown)
            result += 'shift+';
        return result;
    }


    export function isCharacter(key: Key): boolean {
        return (key >= Key.A && key <= Key.Z) || (key >= Key.Zero && key <= Key.Nine);  // TODO
    }
}

export enum MouseButton {
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