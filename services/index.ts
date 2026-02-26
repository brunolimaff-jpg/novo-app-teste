export {
  sendMessageToGemini,
  generateNewSuggestions,
  generateConsolidatedDossier,
  runWarRoomOSINT,
  createChatSession,
  parseMarkers,
  generateContextReminder,
  resetCompanyContext,
  resetChatSession,
} from './geminiService';

export type { GeminiRequestOptions, GeminiResponse } from './geminiService';

export { app, auth } from './firebase';
