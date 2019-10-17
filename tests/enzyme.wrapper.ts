import { ReactWrapper as EnzymeReactWrapper } from 'enzyme';

/**
 * Is the same as the Enzyme ReactWrapper, but you don't have to explicitly specify the props and state generic type arguments.
 */
export type ReactWrapper<C extends React.Component, P = C['props'], S = C['state']> = EnzymeReactWrapper<P, S, C>;

export function wraps<C extends React.Component>(component: ReactWrapper<any>, expectedTypeName: string): component is ReactWrapper<C> {
    const type: any = component.type();
    return type.name == expectedTypeName;
}