/**
 * Pattern and walker for RNG's ``attribute`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { AttributeNameError, AttributeValueError } from "../errors";
import { ConcreteName } from "../name_patterns";
import { NameResolver } from "../name_resolver";
import { map } from "../set";
import { BasePattern, EndResult, Event, EventSet, InternalFireEventResult,
         InternalWalker, Pattern } from "./base";
import { Define } from "./define";
import { Ref } from "./ref";

/**
 * A pattern for attributes.
 */
export class Attribute extends Pattern {
  /**
   * @param xmlPath This is a string which uniquely identifies the
   * element from the simplified RNG tree. Used in debugging.
   *
   * @param name The qualified name of the attribute.
   *
   * @param pat The pattern contained by this one.
   */

  constructor(xmlPath: string, readonly name: ConcreteName,
              readonly pat: Pattern) {
    super(xmlPath);
  }

  _prepare(definitions: Map<string, Define>,
           namespaces: Set<string>): Ref[] | undefined {
    const ret = this.pat._prepare(definitions, namespaces);
    this.name._recordNamespaces(namespaces, false);

    return ret;
  }

  hasAttrs(): boolean {
    return true;
  }

  hasEmptyPattern(): boolean {
    return false;
  }

  newWalker(): InternalWalker<Attribute> {
    // tslint:disable-next-line:no-use-before-declare
    return new AttributeWalker(this,
                               this.pat.newWalker(),
                               false, /* seenName */
                               false,
                               false);
  }
}

/**
 * Walker for [[Attribute]].
 */
class AttributeWalker extends InternalWalker<Attribute> {
  private readonly name: ConcreteName;

  /**
   * @param el The pattern for which this walker was created.
   */
  constructor(protected readonly el: Attribute,
              private readonly subwalker: InternalWalker<BasePattern>,
              private seenName: boolean,
              public canEndAttribute: boolean,
              public canEnd: boolean) {
    super();
    this.name = el.name;
  }

  _clone(): this {
    return new AttributeWalker(this.el,
                               this.subwalker._clone(),
                               this.seenName,
                               this.canEndAttribute,
                               this.canEnd) as this;
  }

  possible(): EventSet {
    return new Set<Event>();
  }

  possibleAttributes(): EventSet {
    if (this.canEnd) {
      return new Set<Event>();
    }

    if (!this.seenName) {
      return new Set([new Event("attributeName", this.name)]);
    }

    // Convert text events to attributeValue events.
    return map(this.subwalker.possible(), (ev: Event) => {
      if (ev.params[0] !== "text") {
        throw new Error(`unexpected event type: ${ev.params[0]}`);
      }

      return new Event("attributeValue", ev.params[1]);
    });
  }

  fireEvent(name: string, params: string[],
            nameResolver: NameResolver): InternalFireEventResult {
    // If canEnd is true, we've done everything we could. So we don't
    // want to match again.
    if (this.canEnd) {
      return new InternalFireEventResult(false);
    }

    let value: string;
    if (this.seenName) {
      if (name !== "attributeValue") {
        return new InternalFireEventResult(false);
      }

      value = params[0];
    }
    else if ((name === "attributeName" || name === "attributeNameAndValue") &&
             this.name.match(params[0], params[1])) {
      this.seenName = true;

      if (name === "attributeName") {
        return new InternalFireEventResult(true);
      }

      value = params[2];
    }
    else {
      return new InternalFireEventResult(false);
    }

    this.canEnd = true;
    this.canEndAttribute = true;

    if (value !== "") {
      const ret = this.subwalker.fireEvent("text", [value], nameResolver);
      if (!ret.matched) {
        ret.errors =
          [new AttributeValueError("invalid attribute value", this.name)];

        return ret;
      }
    }

    return InternalFireEventResult.fromEndResult(this.subwalker.end());
  }

  endAttributes(): EndResult {
    if (this.canEnd) {
      return false;
    }

    // We set the canEnd flags true even though we did not end properly. This
    // prevents producing errors about the same attribute multiple times,
    // because end is called by element walkers when leaveStartTag is
    // encountered, and again when the element closes.
    this.canEnd = true;
    this.canEndAttribute = true;

    return [this.seenName ?
            new AttributeValueError("attribute value missing", this.name) :
            new AttributeNameError("attribute missing", this.name)];
  }

  end(): EndResult {
    return false;
  }
}

//  LocalWords:  RNG's MPL RNG attributeName attributeValue ev params
//  LocalWords:  neutralizeAttribute
