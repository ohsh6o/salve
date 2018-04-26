/**
 * Pattern and walker for RNG's ``list`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { ValidationError } from "../errors";
import { NameResolver } from "../name_resolver";
import { addWalker, BasePattern, cloneIfNeeded, CloneMap, EndResult, Event,
         EventSet, InternalFireEventResult, InternalWalker,
         OneSubpattern } from "./base";
import { Define } from "./define";
import { Ref } from "./ref";

/**
 * List pattern.
 */
export class List extends OneSubpattern {
  _computeHasEmptyPattern(): boolean {
    return this.pat.hasEmptyPattern();
  }

  // We override these because lists cannot contain attributes so there's
  // no point in caching _hasAttrs's result.
  _prepare(definitions: Map<string, Define>,
           namespaces: Set<string>): Ref[] | undefined {
    const ret = this.pat._prepare(definitions, namespaces);
    this._cachedHasEmptyPattern = this._computeHasEmptyPattern();

    return ret;
  }

  hasAttrs(): boolean {
    return false;
  }
}

/**
 * Walker for [[List]].
 *
 */
class ListWalker extends InternalWalker<List> {
  private subwalker: InternalWalker<BasePattern>;
  private readonly nameResolver: NameResolver;
  canEnd: boolean;
  canEndAttribute: boolean;

  protected constructor(other: ListWalker, memo: CloneMap);
  protected constructor(el: List, nameResolver: NameResolver);
  protected constructor(elOrWalker: List | ListWalker,
                        nameResolverOrMemo: NameResolver | CloneMap) {
    if ((elOrWalker as List).newWalker !== undefined) {
      const el = elOrWalker as List;
      const nameResolver = nameResolverOrMemo as NameResolver;
      super(el);
      this.nameResolver = nameResolver;
      this.subwalker = el.pat.newWalker(nameResolver);
      this.canEndAttribute = this.canEnd = this.hasEmptyPattern();
    }
    else {
      const walker = elOrWalker as ListWalker;
      const memo = nameResolverOrMemo as CloneMap;
      super(walker);
      this.nameResolver = cloneIfNeeded(walker.nameResolver, memo);
      this.subwalker = walker.subwalker._clone(memo);
      this.canEnd = walker.canEnd;
      this.canEndAttribute = walker.canEndAttribute;
    }
  }

  possible(): EventSet {
    return this.subwalker.possible();
  }

  possibleAttributes(): EventSet {
    return new Set<Event>();
  }

  fireEvent(name: string, params: string[]): InternalFireEventResult {
    // Only this can match.
    if (name !== "text") {
      return undefined;
    }

    const trimmed = params[0].trim();

    // The list walker cannot send empty strings to its children because it
    // validates a list of **tokens**.
    if (trimmed === "") {
      return false;
    }

    const tokens = trimmed.split(/\s+/);

    for (const token of tokens) {
      const ret = this.subwalker.fireEvent("text", [token]);
      if (ret !== false) {
        this.canEndAttribute = this.canEnd = false;

        return ret;
      }
    }

    this.canEndAttribute = this.canEnd = this.subwalker.canEnd;

    return false;
  }

  end(): EndResult {
    if (this.canEnd) {
      return false;
    }

    const ret = this.subwalker.end();

    return ret !== false ? ret : [new ValidationError("unfulfilled list")];
  }

  endAttributes(): EndResult {
    return false;
  }
}

addWalker(List, ListWalker);

//  LocalWords:  RNG's MPL nd
