import { AppId } from "../base.interfaces";
import { ITestChange } from "../IoC/defaults";

const counterId = 3;
const windowId = 2;
const equationId = 4;

// PropertyChange.CreateReference(Root.Id, Root.Counter, Counter.Id)
export const counterRefResponse: ITestChange =
{
    id: AppId,
    propertyName: 'counter',
    value: { __id: counterId }
};
// PropertyChange.Create(Counter.Id, Counter.CurrentCount, Counter.InitialCurrentCount),
export const counterInitResponse: ITestChange =
{
    id: counterId,
    propertyName: 'currentCount',
    value: 0
};
// PropertyChange.Create(Counter.Id, Counter.CurrentCount, 1)
export const counterIncrementResponse: ITestChange =
{
    id: counterId,
    propertyName: 'currentCount',
    value: 1
};
// PropertyChange.Create(Counter.Id, Counter.CurrentCount, 2)
export const counterIncrementTwiceResponse: ITestChange =
{
    id: counterId,
    propertyName: 'currentCount',
    value: 2
};

// PropertyChange.CreateReference(Root.Id, Root.App, MainWindow.Id),
export const mainWindowRefResponse: ITestChange =
{
    id: AppId,
    propertyName: 'window',
    value: { __id: windowId }
};

export const mainWindowInitResponse: ITestChange =
{
    id: windowId,
    propertyName: 'rootEquation',
    value: { __id: equationId }
};

export const setRootEquationToS: ITestChange =
{
    id: equationId,
    propertyName: 'initialEquation',
    value: 'hello'
};

// export const setRootEquationToS: ITestChange =
// {
//     id: windowId,
//     propertyName: 'initialEquation',
//     value: 'hello'
// };

// export const setRootEquationToS: ITestChange =
// {
//     id: windowId,
//     propertyName: 'rootEquation',
//     value: { initialEquation: 'hello' }
// };
