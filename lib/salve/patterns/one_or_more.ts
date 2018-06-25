/**
 * Pattern and walker for RNG's ``oneOrMore`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { NameResolver } from "../name_resolver";
import { union } from "../set";
import { BasePattern, EndResult, EventSet, InternalFireEventResult,
         InternalWalker, isAttributeEvent, OneSubpattern, Pattern} from "./base";

/**
 * A pattern for ``<oneOrMore>``.
 */
export class  OneOrMore extends OneSubpattern {
  _computeHasEmptyPattern(): boolean {
    return this.pat.hasEmptyPattern();
  }

  newWalker(): InternalWalker<OneOrMore> {
    const hasAttrs = this.hasAttrs();
    const currentIteration = this.pat.newWalker();

    // tslint:disable-next-line:no-use-before-declare
    return new OneOrMoreWalker(this,
                               currentIteration,
                               undefined,
                               hasAttrs,
                               this.pat,
                               !hasAttrs || currentIteration.canEndAttribute,
                               currentIteration.canEnd);
  }
}

/**
 * Walker for [[OneOrMore]]
 */
class OneOrMoreWalker extends InternalWalker<OneOrMore> {
  constructor(protected readonly el: OneOrMore,
              private currentIteration: InternalWalker<BasePattern>,
              private nextIteration: InternalWalker<BasePattern> | undefined,
              private readonly hasAttrs: boolean,
              private readonly subPat: Pattern,
              public canEndAttribute: boolean,
              public canEnd: boolean) {
    super();
  }

  _clone(): this {
    return new OneOrMoreWalker(this.el,
                               this.currentIteration._clone(),
                               this.nextIteration !== undefined ?
                               this.nextIteration._clone() : undefined,
                               this.hasAttrs,
                               this.subPat,
                               this.canEndAttribute,
                               this.canEnd) as this;
  }

  possible(): EventSet {
    const ret = this.currentIteration.possible();

    if (this.currentIteration.canEnd) {
      if (this.nextIteration === undefined) {
        this.nextIteration = this.subPat.newWalker();
      }
      union(ret, this.nextIteration.possible());
    }

    return ret;
  }

  possibleAttributes(): EventSet {
    const ret = this.currentIteration.possibleAttributes();

    if (this.currentIteration.canEnd) {
      if (this.nextIteration === undefined) {
        this.nextIteration = this.subPat.newWalker();
      }
      union(ret, this.nextIteration.possibleAttributes());
    }

    return ret;
  }

  fireEvent(name: string, params: string[],
            nameResolver: NameResolver): InternalFireEventResult {
    const evIsAttributeEvent = isAttributeEvent(name);
    if (evIsAttributeEvent && !this.hasAttrs) {
      return new InternalFireEventResult(false);
    }

    const currentIteration = this.currentIteration;

    const ret = currentIteration.fireEvent(name, params, nameResolver);
    if (ret.matched) {
      if (evIsAttributeEvent) {
        this.canEndAttribute = currentIteration.canEndAttribute;
      }
      this.canEnd = currentIteration.canEnd;

      return ret;
    }

    if (currentIteration.canEnd) {
      if (this.nextIteration === undefined) {
        this.nextIteration = this.subPat.newWalker();
      }
      const nextRet = this.nextIteration.fireEvent(name, params, nameResolver);
      if (nextRet.matched) {
        if (currentIteration.end()) {
          throw new Error(
            "internal error; canEnd returns true but end() fails");
        }

        this.currentIteration = this.nextIteration;
        this.nextIteration = undefined;
        if (evIsAttributeEvent) {
          this.canEndAttribute = this.currentIteration.canEndAttribute;
        }

        this.canEnd = this.currentIteration.canEnd;
      }

      return nextRet;
    }

    return ret;
  }

  end(): EndResult {
    return this.canEnd ? false : this.currentIteration.end();
  }

  endAttributes(): EndResult {
    return this.canEndAttribute ? false : this.currentIteration.endAttributes();
  }
}

//  LocalWords:  RNG's MPL currentIteration nextIteration canEnd oneOrMore rng
//  LocalWords:  anyName suppressAttributes instantiateCurrentIteration
