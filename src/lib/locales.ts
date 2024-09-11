type TextsKeys =
  | "audioInputUnknown"
  | "audioInputNoSource"
  | "videoInputUnknown"
  | "videoInputNoSource"
  | "results"
  | "resultsSubmit"
  | "resultsCancel"
  | "resultsDone"
  | "error"
  | "selectionQuestion"
  | "selectionNone"
  | "selectionMics"
  | "selectionWindows"
  | "selectionDisplays"
  | "selectionEmpty"

const TEXTS_EN: Record<TextsKeys, string> = {
  audioInputUnknown: 'Unknown source',
  audioInputNoSource: 'No audio source selected',
  videoInputUnknown: 'Unknown source',
  videoInputNoSource: 'No video source selected',
  results: 'Results',
  resultsSubmit: 'Submit',
  resultsCancel: 'Cancel',
  resultsDone: 'Done',
  error: 'Error',
  selectionQuestion: 'What do you want to record?',
  selectionNone: 'None',
  selectionMics: 'Microphones',
  selectionWindows: 'Windows',
  selectionDisplays: 'Displays',
  selectionEmpty: 'No items'
}

const TEXTS_FR: Record<TextsKeys, string> = {
  audioInputUnknown: 'Inconnu',
  audioInputNoSource: 'Aucune source audio sélectionnée',
  videoInputUnknown: 'Support limité - Source inconnue',
  videoInputNoSource: 'Aucune source vidéo sélectionnée',
  results: 'Résultats',
  resultsSubmit: 'Soumettre',
  resultsCancel: 'Annuler',
  resultsDone: 'Terminé',
  error: 'Erreur',
  selectionQuestion: 'Que voulez-vous enregistrer?',
  selectionNone: 'Aucun',
  selectionMics: 'Microphones',
  selectionWindows: 'Fenêtres',
  selectionDisplays: 'Écrans',
  selectionEmpty: 'Aucun élément'
}

export function getText(locale: string | undefined, key: TextsKeys): string {
  switch (locale) {
    case 'fr':
      return TEXTS_FR[key]
    default:
      return TEXTS_EN[key]
  }
}
