import merge from "lodash.merge";

import { Page as PageType } from "@models/pages/types";

import { ExecutorPagesComponents } from "./ExecutorPagesComponents";
import { ExecutorPagesData } from "./ExecutorPagesData";

export const ExecutorPages: PageType = merge(ExecutorPagesComponents, ExecutorPagesData);
