import { IAppConfig } from "./IAppConfig";

export const config: IAppConfig = {} as any;
export const updateConfig = () => {
	Object.assign(config, (window as any).frontendConfig);
};
