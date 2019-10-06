import { Rect } from 'jbsnorro';

export interface IDocumentMeasurer {
    getBoundingClientRect(element: HTMLElement): Rect;
    getBoundingClientRectWithoutPadding(element: HTMLElement): Rect;
    hDataElementsFromPoint(document: Document, x: number, y: number): HTMLElement[];
}