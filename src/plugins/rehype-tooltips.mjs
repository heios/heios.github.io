import { visit } from 'unist-util-visit';

/**
 * Turn every `<a title="...">` (i.e. Markdown `[text](url "title")`) into a
 * styled hover-card trigger: the title becomes a `data-tooltip` attribute and the
 * link gets a `tip` class that src/styles/custom.css renders as a tooltip. The
 * native `title` is removed so the browser's plain built-in tooltip doesn't also
 * fire. No changes to the source Markdown are needed.
 */
export default function rehypeTooltips() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const props = node.properties;
      if (!props || props.title == null || props.title === '') return;
      props['data-tooltip'] = String(props.title);
      delete props.title;
      const cls = props.className;
      if (Array.isArray(cls)) props.className = [...cls, 'tip'];
      else if (cls) props.className = [cls, 'tip'];
      else props.className = ['tip'];
    });
  };
}
