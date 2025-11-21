import { AsyncLocalStorage } from "async_hooks";

const AppLocalStorage = new AsyncLocalStorage();
export default AppLocalStorage;
