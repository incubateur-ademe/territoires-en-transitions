export type TQuestionThematiqueCompletudeRead = {
  collectivite_id: number;
  id: string;
  nom: string;
  referentiels: string[];
  completude: 'complete' | 'a_completer';
};
