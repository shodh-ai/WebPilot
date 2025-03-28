import { getUserData } from "./getUserData"
import { getDBSchema } from "./getSchema"
import { getDBData } from "./getDBData"

export const functions = {
  "getSchema": getDBSchema,
  "getUserData": getUserData,
  "getDBData": getDBData
}
