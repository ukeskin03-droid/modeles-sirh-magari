/**
 * LIBELLÉS ET VOCABULAIRE
 *
 * Aucun texte n'est écrit en dur dans les écrans. Chaque texte est un « libellé »,
 * rangé dans un fichier labels.fr.ts (un pour le moteur, un par module) et désigné
 * par une clé, ex. "core.nav.home".
 *
 * Un libellé peut contenir :
 *   {prenom}                 une valeur fournie par l'écran ;
 *   {terme:news.item}        le terme de la communauté, au singulier (« Actualité ») ;
 *   {termes:news.item}       le même terme au pluriel (« Actualités ») ;
 *   {terme_min:news.item}    au singulier, sans majuscule initiale (« actualité ») ;
 *   {termes_min:news.item}   au pluriel, sans majuscule initiale (« actualités »).
 *
 * RÈGLE DE RÉDACTION : un terme peut être renommé par la communauté avec un autre genre
 * (« Article » → « Fiche »). Les libellés ne doivent donc jamais accorder un mot avec
 * un terme : écrire « {termes:knowledge.article} : aucun résultat », jamais
 * « Aucun {terme_min:knowledge.article} trouvé ».
 */

export type Term = { singular: string; plural: string };
export type Vocabulary = Record<string, Term>;
export type Labels = Record<string, string>;
export type LabelParams = Record<string, string | number>;
export type Translator = (key: string, params?: LabelParams) => string;

/** Met la première lettre en minuscule, sauf pour un sigle (« FAQ » reste « FAQ »). */
function lowerFirst(text: string): string {
  if (text.length < 2) return text.toLowerCase();
  const second = text[1];
  const isAcronym = second === second.toUpperCase() && second !== second.toLowerCase();
  return isAcronym ? text : text[0].toLowerCase() + text.slice(1);
}

const TERM_PATTERN = /\{(terme|termes|terme_min|termes_min):([a-zA-Z0-9_.-]+)\}/g;
const PARAM_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

/** Les termes par défaut des modules, remplacés par ceux que la communauté a renommés. */
export function mergeVocabulary(defaults: Vocabulary, overrides: Vocabulary): Vocabulary {
  const merged: Vocabulary = { ...defaults };
  for (const [key, term] of Object.entries(overrides)) {
    // Un terme inconnu (module non installé) est ignoré.
    if (key in defaults) merged[key] = term;
  }
  return merged;
}

export function createTranslator(labels: Labels, vocabulary: Vocabulary): Translator {
  return (key, params = {}) => {
    const template = labels[key];
    if (template === undefined) {
      // Libellé manquant : on l'affiche de façon voyante plutôt que de planter la page.
      return `⟦${key}⟧`;
    }
    return template
      .replace(TERM_PATTERN, (match, form: string, termKey: string) => {
        const term = vocabulary[termKey];
        if (!term) return match;
        const text = form.startsWith("termes") ? term.plural : term.singular;
        return form.endsWith("_min") ? lowerFirst(text) : text;
      })
      .replace(PARAM_PATTERN, (match, name: string) => (name in params ? String(params[name]) : match));
  };
}
