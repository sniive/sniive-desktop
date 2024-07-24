type TextsKeys =
  | 'audioInputUnknown'
  | 'audioInputNoSource'
  | 'updateAvailable'
  | 'restartToApply'
  | 'results'
  | 'resultUpload'
  | 'resultUploading'
  | 'resultDone'
  | 'videoInputUnknown'
  | 'videoInputNoSource'
  | 'stopRecording'
  | 'startRecording'

const TEXTS_EN: Record<TextsKeys, string> = {
  audioInputUnknown: 'Unknown',
  audioInputNoSource: 'No audio source selected',
  updateAvailable: 'Update available',
  restartToApply: 'Restart to apply',
  results: 'Results',
  resultUpload: 'Upload',
  resultUploading: 'Uploading...',
  resultDone: 'Done !',
  videoInputUnknown: 'Limited support - Unknown source',
  videoInputNoSource: 'No video source selected',
  stopRecording: 'Stop recording',
  startRecording: 'Start recording'
}

const TEXTS_FR: Record<TextsKeys, string> = {
  audioInputUnknown: 'Inconnu',
  audioInputNoSource: 'Aucune source audio sélectionnée',
  updateAvailable: 'Mise à jour disponible',
  restartToApply: 'Redémarrer pour appliquer',
  results: 'Résultats',
  resultUpload: 'Uploader',
  resultUploading: 'En cours...',
  resultDone: 'Terminé !',
  videoInputUnknown: 'Support limité - Source inconnue',
  videoInputNoSource: 'Aucune source vidéo sélectionnée',
  stopRecording: "Arrêter l'enregistrement",
  startRecording: "Démarrer l'enregistrement"
}

export function getText(locale: string | undefined, key: TextsKeys): string {
  switch (locale) {
    case 'fr':
      return TEXTS_FR[key]
    default:
      return TEXTS_EN[key]
  }
}
