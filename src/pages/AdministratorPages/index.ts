import merge from "lodash.merge";

import { Page as PageType } from "@models/pages/types";

import { AdministratorPagesComponents } from "./AdministratorPagesComponents";
import { AdministratorPagesData } from "./AdministratorPagesData";

export const AdministratorPages: PageType = merge(AdministratorPagesComponents, AdministratorPagesData);
