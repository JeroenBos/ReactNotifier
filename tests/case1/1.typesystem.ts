import { TypeSystem, TypeDescriptionsFor, createCreateFunction, nullable, PrimitiveTypes } from 'jbsnorro-typesafety';
import { AppState } from './1.app.component';
import { AllTypeDescriptions0, CheckableTypes0 } from '../case0/0.typesystem';
import { MainWindowProps, MainWindowState } from './1.mainwindow.component';
const create = <T extends object>() => createCreateFunction<CheckableTypes1, T>();

type overriddenTypes = 'AppState';
type newCheckableTypes = {
    'AppState': AppState,
    'MainWindowProps': MainWindowProps
    'nullable MainWindowProps': MainWindowProps | null
    'MainWindowState': MainWindowState
}
export type CheckableTypes1 = newCheckableTypes & Omit<CheckableTypes0, overriddenTypes>;

class NewTypeDescriptions implements TypeDescriptionsFor<newCheckableTypes> {
    public readonly AppState = create<AppState>()({ window: 'nullable MainWindowProps' });
    public readonly MainWindowProps = create<MainWindowProps>()({ __id: 'number', rootEquation: 'string' });
    public readonly 'nullable MainWindowProps' = nullable(this.MainWindowProps);
    public readonly MainWindowState = create<MainWindowState>()({});
}

export const AllTypeDescriptions1: TypeDescriptionsFor<CheckableTypes1 & PrimitiveTypes> = { ...new AllTypeDescriptions0(), ...new NewTypeDescriptions() };

export const typesystem = new TypeSystem(AllTypeDescriptions1, console.error);