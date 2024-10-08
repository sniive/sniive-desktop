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
  | "notAuthenticatedErrorFirst"
  | "notAuthenticatedErrorSecond";

const TEXTS_EN: Record<TextsKeys, string> = {
  audioInputUnknown: "Unknown source",
  audioInputNoSource: "No audio source selected",
  videoInputUnknown: "Unknown source",
  videoInputNoSource: "No video source selected",
  results: "Is everything okay?",
  resultsSubmit: "Yes",
  resultsCancel: "Cancel",
  resultsDone: "Done!",
  error: "Error",
  selectionQuestion: "What do you want to record?",
  selectionNone: "None",
  selectionMics: "Microphones",
  selectionWindows: "Windows",
  selectionDisplays: "Displays",
  selectionEmpty: "No items",
  notAuthenticatedErrorFirst: "Open Sniive via",
  notAuthenticatedErrorSecond: "to start capturing.",
};

const TEXTS_FR: Record<TextsKeys, string> = {
  audioInputUnknown: "Inconnu",
  audioInputNoSource: "Aucune source audio sélectionnée",
  videoInputUnknown: "Support limité - Source inconnue",
  videoInputNoSource: "Aucune source vidéo sélectionnée",
  results: "Tout est bon ?",
  resultsSubmit: "Oui",
  resultsCancel: "Annuler",
  resultsDone: "Terminé !",
  error: "Erreur",
  selectionQuestion: "Que voulez-vous enregistrer ?",
  selectionNone: "Aucun",
  selectionMics: "Microphones",
  selectionWindows: "Fenêtres",
  selectionDisplays: "Écrans",
  selectionEmpty: "Aucun élément",
  notAuthenticatedErrorFirst: "Ouvrez Sniive via",
  notAuthenticatedErrorSecond: "pour démarrer la capture.",
};

export function getText(locale: string | undefined, key: TextsKeys): string {
  switch (locale) {
    case "fr":
      return TEXTS_FR[key];
    default:
      return TEXTS_EN[key];
  }
}
