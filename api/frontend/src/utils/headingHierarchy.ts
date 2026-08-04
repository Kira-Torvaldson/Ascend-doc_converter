/**
 * Construit une hiérarchie de titres à partir d’une liste plate.
 */

export interface FlatHeading {
  lineIndex: number;
  level: number;
  title: string;
}

export interface HeadingTreeNode {
  heading: FlatHeading;
  children: HeadingTreeNode[];
}

export function buildHeadingHierarchy(headings: FlatHeading[]): HeadingTreeNode[] {
  const result: HeadingTreeNode[] = [];
  const stack: HeadingTreeNode[] = [];

  headings.forEach((heading) => {
    const item: HeadingTreeNode = { heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].heading.level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  });

  return result;
}
