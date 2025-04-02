import { getUserData } from "./getUserData";
import { getDBSchema } from "./getSchema";
import { getDBData } from "./getDBData";
import { navigateTo, fillInput, clickElement, submitForm } from "./domActions";

export const functions = {
  "getDBSchema": getDBSchema,
  "getUserData": getUserData,
  "getDBData": getDBData,
  "navigateTo": navigateTo,
  "fillInput": fillInput,
  "clickElement": clickElement,
  "submitForm": submitForm
};