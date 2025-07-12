// src/app/core/constants.ts
// this file works as a central place to define constants used across the application, in this case, the API base URL
// It can be imported in any component or service that needs to make API calls

import { environment } from '../../../environments/environment';

// Usar la configuración del environment
export const API_BASE_URL = environment.apiUrl;