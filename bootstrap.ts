import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server folder where the .env file is located
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, 'server', '.env') });

import './server/index';
