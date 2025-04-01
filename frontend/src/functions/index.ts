import { getUserData } from "./getUserData"
import { getDBSchema } from "./getSchema"
import { getDBData } from "./getDBData"

export const functions = {
  "getDBSchema": getDBSchema,
  "getUserData": getUserData,
  "getDBData": getDBData
}
