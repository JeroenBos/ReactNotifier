// you can't derive from typesystem 1 because there's still an 
import { TypeSystem, TypeDescriptionsFor, nullable, PrimitiveTypes, BaseTypeDescriptions } from 'jbsnorro-typesafety';
import { AppState } from './2.app.component';
import { AllTypeDescriptions0, CheckableTypes0 } from '../case0/0.typesystem';
import { MainWindowProps, MainWindowState } from './2.mainwindow.component';

type overriddenTypes = 'AppState';
type newCheckableTypes = {
    'AppState': AppState,
    'MainWindowProps': MainWindowProps
    'nullable MainWindowProps': MainWindowProps | null
    'MainWindowState': MainWindowState
}
export type CheckableTypes1 = newCheckableTypes & Omit<CheckableTypes0, overriddenTypes>;
const create = new BaseTypeDescriptions<newCheckableTypes>().create;

class NewTypeDescriptions implements TypeDescriptionsFor<newCheckableTypes> {
    public readonly AppState = create<AppState>({ window: 'nullable MainWindowProps' });
    public readonly MainWindowProps = create<MainWindowProps>({ __id: 'number' });
    public readonly 'nullable MainWindowProps' = nullable(this.MainWindowProps);
    public readonly MainWindowState = create<MainWindowState>({ rootEquation: 'string' });
}

export const AllTypeDescriptions1: TypeDescriptionsFor<CheckableTypes1 & PrimitiveTypes> = { ...new AllTypeDescriptions0(), ...new NewTypeDescriptions() };

export const typesystem = new TypeSystem(AllTypeDescriptions1, console.error);