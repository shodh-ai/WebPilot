import { getUserData } from "./getUserData"
import { getDBSchema } from "./getSchema"

export const functions = {
    "getSchema": getDBSchema,
    "getUserData": getUserData,
}