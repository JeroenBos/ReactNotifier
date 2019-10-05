import { BaseProps, IComponent } from "../base.interfaces";

export type SerializedComponentProps = (BaseProps & { isCollection: boolean });
export type SerializedType = SerializedComponentProps | string | number | object;
export type AdmissiblePrimitiveType = string | number | object;
export function isComponentProps(obj: any): obj is SerializedComponentProps & { isCollection: boolean } {
    return obj != null && obj.__id !== undefined;
}
export function isComponent(obj: any): obj is IComponent {
    return obj != null && obj.state != undefined && obj.props != undefined;
}
export type StateType = IComponent | AdmissiblePrimitiveType;