/**
 * Affichage d'un texte rédigé en Markdown (titres, listes, liens, tableaux, images).
 * Le HTML éventuellement présent dans le texte n'est jamais interprété : c'est ce qui
 * rend l'affichage sûr, même pour un contenu importé.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <div className={compact ? "markdown markdown-compact" : "markdown"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Les liens externes s'ouvrent dans un nouvel onglet, sans donner la main au site visité.
          a: ({ href, children: content }) =>
            href && /^https?:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <a href={href}>{content}</a>
            ),
          // Les tableaux défilent horizontalement sur petit écran.
          table: ({ children: content }) => (
            <div className="markdown-table">
              <table>{content}</table>
            </div>
          ),
          // eslint-disable-next-line @next/next/no-img-element -- images de la médiathèque, de taille libre
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
