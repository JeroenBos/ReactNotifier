import { TypeSystem, TypeDescriptionsFor, nullable, PrimitiveTypes, BaseTypeDescriptions } from 'jbsnorro-typesafety';
import { AppState } from './1.app.component';
import { AllTypeDescriptions0, CheckableTypes0 } from '../case0/0.typesystem';
import { MainWindowProps, MainWindowState } from './1.mainwindow.component';
const create = new BaseTypeDescriptions<newCheckableTypes>().create;

type overriddenTypes = 'AppState';
type newCheckableTypes = {
    'AppState': AppState,
    'MainWindowProps': MainWindowProps
    'nullable MainWindowProps': MainWindowProps | null
    'MainWindowState': MainWindowState
}
export type CheckableTypes1 = newCheckableTypes & Omit<CheckableTypes0, overriddenTypes>;

class NewTypeDescriptions implements TypeDescriptionsFor<newCheckableTypes> {
    public readonly AppState = create<AppState>({ window: 'nullable MainWindowProps' });
    public readonly MainWindowProps = create<MainWindowProps>({ __id: 'number', rootEquation: 'string' });
    public readonly 'nullable MainWindowProps' = nullable(this.MainWindowProps);
    public readonly MainWindowState = create<MainWindowState>({});
}

export const AllTypeDescriptions1 = { ...new AllTypeDescriptions0(), ...new NewTypeDescriptions() };

export const typesystem = new TypeSystem<CheckableTypes1 & PrimitiveTypes>(AllTypeDescriptions1, console.error);