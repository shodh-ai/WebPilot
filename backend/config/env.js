import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../.env') });

console.log('Loaded ENV:', process.env.BACKEND_PORT);
