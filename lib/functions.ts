import * as ts from 'typescript';

export interface F0<R> {
  (): R;
}

export interface F1<A0, R> {
  (a0: A0): R;
}

export interface F2<A0, A1, R> {
  (a0: A0, a1: A1): R;
}

export interface F3<A0, A1, A2, R> {
  (a0: A0, a1: A1, a2: A2): R;
}

function nullOrUndef(t: any) {
  return t === null || t === undefined;
}

export class Maybe<T> {

  static nothing = new Maybe<any>(undefined);

  static lift<T>(t: T) {
    if (nullOrUndef(t)) {
      return Maybe.nothing;
    }
    return new Maybe<T>(t);
  }

  static all<T0, T1>(t0: Maybe<T0>, t1: Maybe<T1>): Maybe<[T0, T1]> {
    return t0.bind(_t0 => t1.fmap(_t1 => [_t0, _t1] as [T0, T1]));
  }

  private constructor(private t: T | undefined) {
  }

  bind<R>(fn: F1<T, Maybe<R>>): Maybe<R> {
    if (!nullOrUndef(this.t)) {
      return fn(this.t);
    }
    return Maybe.nothing;
  }

  fmap<R>(fn: F1<T, R>): Maybe<R> {
    return this.bind(t => Maybe.lift(fn(t)));
  }

  get isNothing() {
    return nullOrUndef(this.t);
  }

  get isSomething() {
    return !nullOrUndef(this.t);
  }

  catch(def: () => Maybe<T>): Maybe<T> {
    if (this.isNothing) {
      return def();
    }
    return this;
  }

  unwrap(): T | undefined {
    return this.t;
  }
}

export function unwrapFirst<T>(ts: Maybe<T>[]): T | undefined {
  const f = ts.find((t: Maybe<T>) => t.isSomething);
  if (!!f) {
    return f.unwrap();
  }
  return undefined;
}

export function all<T>(...preds: F1<T, boolean>[]): F1<T, boolean> {
  return (t: T) => !preds.find(p => !p(t));
}

export function any<T>(...preds: F1<T, boolean>[]): F1<T, boolean> {
  return (t: T) => !!preds.find(p => p(t));
}

export function ifTrue<T>(pred: F1<T, boolean>): F1<T, Maybe<T>> {
  return (t: T) => (pred(t)) ? Maybe.lift(t) : Maybe.nothing;
}

export function listToMaybe<T>(ms: Maybe<T>[]): Maybe<T[]> {
  const unWrapped = ms.filter(m => m.isSomething).map(m => m.unwrap());
  return unWrapped.length !== 0 ? Maybe.lift(unWrapped) : Maybe.nothing;
}

export function traverse<T extends ts.Node>(matchFn: F1<ts.Node, boolean>): F1<ts.Node, T | undefined> {
  return function (node: ts.Node): T {
    function visitNode(n: ts.Node): T | undefined {
      if (matchFn(n)) {
        return n as T;
      }
      return ts.forEachChild(n, visitNode);
    }

    return visitNode(node);
  }
}

export function traverseFilter<T extends ts.Node>(matchFn: F1<ts.Node, boolean>): F1<ts.Node, T[] | undefined> {
  return function (node: ts.Node): T[] {
    const found: T[] = [];

    function visitNode(n: ts.Node) {
      if (matchFn(n)) {
        found.push(n as T);
      }
      ts.forEachChild(n, visitNode);
    }

    visitNode(node);
    return found.length ? found : undefined;
  }
}

export function getText(node: ts.Node): string {
  return node.getText();
}

export function getTexts(nodes: ts.Node[]): string[] {
  return nodes.map(getText);
}

export const getDecoratorName = (decorator: ts.Decorator) => {
  let baseExpr = <any>decorator.expression || {};
  let expr = baseExpr.expression || {};
  return expr.text;
};

export function findByKind<T extends ts.Node>(kind: ts.SyntaxKind): F1<ts.Node, T | undefined> {
  return traverse((n: ts.Node) => n.kind === kind);
}

export function filterByKind<T extends ts.Node>(kind: ts.SyntaxKind): F1<ts.Node, T[] | undefined> {
  return traverseFilter((n: ts.Node) => n.kind === kind);
}

export function findNgModuleDecorator(): F1<ts.ClassDeclaration, ts.Decorator> {
  return (node: ts.ClassDeclaration) => {
    if (node.decorators) {
      return node.decorators.find(d => getDecoratorName(d) === 'NgModule');
    }
  }
}

export function findNgModule(sourceFile: ts.SourceFile): Maybe<ts.ObjectLiteralExpression> {
  return Maybe.lift(sourceFile)
      .fmap(findByKind(ts.SyntaxKind.ClassDeclaration))
      .fmap(findNgModuleDecorator())
      .fmap(findByKind(ts.SyntaxKind.CallExpression))
      .fmap(findByKind(ts.SyntaxKind.ObjectLiteralExpression));
}

export function findPropertyName(propertyName: string): F1<ts.ObjectLiteralExpression, ts.ObjectLiteralElement> {
  return (objectLiteralExpression: ts.ObjectLiteralExpression) => {
    return objectLiteralExpression.properties.find(p => p.name.getText() === propertyName);
  }
}
