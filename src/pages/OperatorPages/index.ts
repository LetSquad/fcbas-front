import merge from "lodash.merge";

import { Page as PageType } from "@models/pages/types";

import { OperatorPagesComponents } from "./OperatorPagesComponents";
import { OperatorPagesData } from "./OperatorPagesData";

export const OperatorPages: PageType = merge(OperatorPagesComponents, OperatorPagesData);
