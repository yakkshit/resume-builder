/**
 * Database / Storage Layer Index
 * Self-contained data access and persistence layer.
 */

import * as schema from "./schema";
import { DatabaseService } from "./plsql-storage";

export const db = DatabaseService;
export { schema, DatabaseService };
export default DatabaseService;
